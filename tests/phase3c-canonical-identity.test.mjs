import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("browser restore reads only the authenticated UID document and verifies its field", () => {
  assert.match(html, /const membershipAuthUid = authUser\?\.uid \|\| ""/);
  assert.match(html, /"participants", membershipAuthUid/);
  assert.match(html, /participantData\?\.membershipAuthUid/);
  assert.doesNotMatch(html, /storedState\?\.participantId/);
});

test("same-hangout persistence restores, while an unrelated invite with no membership joins fresh", () => {
  const restoreFlow = html.match(/async function restoreJoinedState\([\s\S]*?function clearPeopleSection/)?.[0] || "";
  const loadFlow = html.match(/async function loadPreview\([\s\S]*?function getRejoinDisplayName/)?.[0] || "";
  assert.match(restoreFlow, /storedState && authUser\?\.uid/);
  assert.match(restoreFlow, /restoreResult\.reason === "participant-doc-missing"/);
  assert.match(loadFlow, /restoreResult\.status === "not-joined"/);
  assert.match(loadFlow, /renderPreview\(preview\)/);
});

test("transient restore retries only when this hangout has a local membership hint", () => {
  const restoreFlow = html.match(/async function restoreJoinedState\([\s\S]*?function clearPeopleSection/)?.[0] || "";
  assert.match(restoreFlow, /hasMatchingStoredMembership = Boolean\(storedState && authUser\?\.uid\)/);
  assert.match(restoreFlow, /hasMatchingStoredMembership && isTransientRestoreError\(error\)/);
});

test("local storage does not persist an independently trusted participant ID", () => {
  const saveFunctions = html.match(/function saveJoinedState\(\)[\s\S]*?function restoreParticipantIdentity/)?.[0] || "";
  assert.doesNotMatch(saveFunctions, /participantId\s*:|joinedAt\s*:|leftAt\s*:/);
  assert.match(saveFunctions, /hangoutId/);
});

test("private listeners start only from joined state", () => {
  const renderPreview = html.match(/function renderPreview\([\s\S]*?function showJoinedState/)?.[0] || "";
  const showJoinedState = html.match(/function showJoinedState\([\s\S]*?function canRejoinCurrentHangout/)?.[0] || "";
  assert.doesNotMatch(renderPreview, /startPeopleListeners\(\)/);
  assert.match(showJoinedState, /startPeopleListeners\(\)/);
});

test("leave is callable-only and participant identity is not sent", () => {
  const leaveFlow = html.match(/async function requestLeaveParticipant\([\s\S]*?async function loadPreview/)?.[0] || "";
  assert.match(leaveFlow, /leaveParticipant\(\{ hangoutId \}\)/);
  assert.doesNotMatch(leaveFlow, /updateDoc|updateParticipantStatus|participantId\s*:/);
});

test("inactive canonical membership shows Leave state and rejoin uses the invite callable", () => {
  const restoreIdentity = html.match(/async function restoreParticipantIdentity\([\s\S]*?function isTransientRestoreError/)?.[0] || "";
  const joinFlow = html.match(/async function joinCurrentHangout\([\s\S]*?leaveButton\.addEventListener/)?.[0] || "";
  assert.match(restoreIdentity, /!isParticipantActive\(participantData\)/);
  assert.match(restoreIdentity, /showLeftState\(\)/);
  assert.match(joinFlow, /joinHangout\(\{[\s\S]*hangoutId,[\s\S]*inviteToken,[\s\S]*displayName/);
});

test("legacy runtime identity aliases are absent", () => {
  for (const legacyName of [
    "currentBrowserParticipantId",
    "participantAuthUid",
    "webAuthUid",
    "migratedToUid",
    "legacyParticipantId",
    "organizerId"
  ]) {
    assert.doesNotMatch(html, new RegExp(legacyName));
  }
  assert.match(html, /hangoutData\?\.ownerUid/);
});
