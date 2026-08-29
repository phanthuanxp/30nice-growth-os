import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { resolveUploadPath, safeFilename, uploadsRoot } from "@/server/media/paths";

describe("upload path containment", () => {
  it("resolves ordinary tenant files under the uploads root", () => {
    const resolved = resolveUploadPath(["tenant_1", "1712345678_photo.jpg"]);
    assert.equal(resolved, path.join(uploadsRoot(), "tenant_1", "1712345678_photo.jpg"));
  });

  it("rejects traversal out of the uploads root", () => {
    assert.equal(resolveUploadPath(["..", "..", "etc", "passwd"]), null);
    assert.equal(resolveUploadPath(["tenant_1", "..", "..", "..", "secrets.env"]), null);
  });

  it("rejects a sibling directory that merely shares the root prefix", () => {
    // `startsWith(uploadsRoot)` alone would accept public/uploads-backup.
    assert.equal(resolveUploadPath(["..", "uploads-backup", "leak.jpg"]), null);
  });

  it("rejects absolute segments and empty input", () => {
    assert.equal(resolveUploadPath(["/etc/passwd"]), null);
    assert.equal(resolveUploadPath([]), null);
    assert.equal(resolveUploadPath(["tenant_1", ""]), null);
  });
});

describe("uploaded filenames", () => {
  it("strips directory components and unsafe characters", () => {
    assert.equal(safeFilename("../../evil.sh"), "evil.sh");
    assert.equal(safeFilename("my photo (1).PNG"), "my_photo__1_.PNG");
    assert.equal(safeFilename("/tmp/x/report.jpg"), "report.jpg");
  });

  it("never returns a dotfile or an empty name", () => {
    assert.equal(safeFilename(".htaccess").startsWith("."), false);
    assert.equal(safeFilename("").length > 0, true);
  });
});
