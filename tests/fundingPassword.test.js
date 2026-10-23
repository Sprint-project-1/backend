import test from "node:test";
import assert from "node:assert/strict";
import { hashFundingPassword, verifyFundingPassword } from "../src/utils/fundingPassword.js";

test("funding password hash is salted and verifies only the original password", async () => {
  const first = await hashFundingPassword("cinefund123");
  const second = await hashFundingPassword("cinefund123");

  assert.match(first, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.notEqual(first, second);
  assert.equal(await verifyFundingPassword("cinefund123", first), true);
  assert.equal(await verifyFundingPassword("wrongpass123", first), false);
});

test("funding password verification rejects malformed stored hashes", async () => {
  for (const encoded of [null, "", "sha256:bad:bad", "scrypt:xyz:1234", "scrypt:00:00:extra"]) {
    assert.equal(await verifyFundingPassword("cinefund123", encoded), false);
  }
});
