import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

function extractFunction(name, nextName) {
  const pattern = new RegExp(`    function ${name}\\([\\s\\S]*?(?=\\n    function ${nextName}\\()`);
  const source = html.match(pattern)?.[0];
  assert.ok(source, `Expected to find ${name} in index.html`);
  return source;
}

const helperSource = [
  extractFunction("normalizeActivityText", "isPlaceholderActivityText"),
  extractFunction("isPlaceholderActivityText", "getActivityUpdates"),
  extractFunction("getPreviewActivityText", "getLocationUpdates"),
  extractFunction("getActivityPhrase", "getInviteActivityPhrase"),
  extractFunction("getInviteActivityPhrase", "getInviteTitle"),
  extractFunction("getInviteTitle", "updatePreviewTitle")
].join("\n");

const {
  getPreviewActivityText,
  getInviteTitle
} = Function(`${helperSource}\nreturn { getPreviewActivityText, getInviteTitle };`)();

test("raw Drinking Tea wins over normalized drinks", () => {
  const preview = {
    organizerDisplayName: "Levi",
    activity: "Drinking Tea",
    activityDisplayName: "drinks",
    activityInvitePhrase: "for drinks"
  };

  assert.equal(getPreviewActivityText(preview), "Drinking Tea");
  assert.equal(getInviteTitle(preview), "Levi is inviting you for Drinking Tea");
});

test("raw Coffee at Jim's wins over normalized coffee", () => {
  const preview = {
    organizerDisplayName: "Levi",
    activity: "Coffee at Jim's",
    activityDisplayName: "coffee",
    activityInvitePhrase: "for coffee"
  };

  assert.equal(getPreviewActivityText(preview), "Coffee at Jim's");
  assert.equal(getInviteTitle(preview), "Levi is inviting you for Coffee at Jim's");
});

test("legacy previews retain display-name and invite-phrase fallbacks", () => {
  const displayNamePreview = {
    organizerDisplayName: "Levi",
    activityDisplayName: "drinks",
    activityInvitePhrase: "for drinks"
  };
  const invitePhraseOnlyPreview = {
    organizerDisplayName: "Levi",
    activityInvitePhrase: "for drinks"
  };

  assert.equal(getPreviewActivityText(displayNamePreview), "drinks");
  assert.equal(getInviteTitle(displayNamePreview), "Levi is inviting you for drinks");
  assert.equal(getPreviewActivityText(invitePhraseOnlyPreview), "");
  assert.equal(getInviteTitle(invitePhraseOnlyPreview), "Levi is inviting you for drinks");
});
