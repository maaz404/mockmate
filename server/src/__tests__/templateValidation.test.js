const path = require("path");
const fs = require("fs");

// Simple structural validation for questionTemplates.json
// Ensures each role has at least one technical and one behavioral question overall.

describe("questionTemplates structural validation", () => {
  const templatePath = path.join(
    __dirname,
    "..",
    "data",
    "questionTemplates.json"
  );
  const templates = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  test("each role has required minimum coverage", () => {
    const failingRoles = [];
    Object.entries(templates).forEach(([role, roleData]) => {
      let technical = 0;
      let behavioral = 0;
      Object.values(roleData).forEach((level) => {
        if (!level) return;
        if (Array.isArray(level.technical)) technical += level.technical.length;
        if (Array.isArray(level["system-design"]))
          technical += level["system-design"].length;
        if (Array.isArray(level.behavioral))
          behavioral += level.behavioral.length;
      });
      if (technical < 1 || behavioral < 1) {
        failingRoles.push({ role, technical, behavioral });
      }
    });
    // eslint-disable-next-line no-console
    if (failingRoles.length)
      console.error("Roles failing minimum coverage:", failingRoles);
    expect(failingRoles).toHaveLength(0);
  });
});
