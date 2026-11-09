import { expect, test } from "@playwright/test";

test.describe("mock authentication boundary", () => {
  test("redirects unauthenticated admin routes to sign-in", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fdashboard/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Work email").fill("admin@lplatform.dev");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Sign in to admin portal" }).click();

    await expect(page.getByText("Invalid email address or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("admin portal golden path", () => {
  test("onboards an organization and exercises the administrative workflow", async ({ page }) => {
    test.setTimeout(180_000);
    const suffix = Date.now().toString(36);
    const organizationName = `QA Academy ${suffix}`;
    const organizationEmail = `office.qa.${suffix}@example.edu`;
    const administratorEmail = `principal.qa.${suffix}@example.edu`;
    const now = new Date();
    const startYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
    const academicYear = `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
    const studentEmail = `student.qa.${suffix}@example.edu`;
    const inviteEmail = `invite.qa.${suffix}@example.edu`;
    const courseTitle = `QA Automation Fundamentals ${suffix}`;

    await test.step("sign in with the demo platform administrator", async () => {
      await page.goto("/login");
      await page.getByRole("button", { name: /Platform administrator/ }).click();
      await page.getByRole("button", { name: "Sign in to admin portal" }).click();

      await expect(page).toHaveURL(/\/admin\/dashboard/);
      await expect(page.getByRole("heading", { name: "Platform dashboard" })).toBeVisible();
    });

    let organizationId = "";
    await test.step("create an organization and its initial administrator invitation", async () => {
      await page.goto("/admin/organizations/new");
      await page.getByLabel("Organization name").fill(organizationName);
      await page.getByLabel("Contact name").fill("QA Contact");
      await page.getByLabel("Contact email").fill(organizationEmail);
      await page.getByLabel("Phone").fill("+91 98765 43210");
      await page.getByLabel("Address").fill("12 Quality Assurance Road");
      await page.getByLabel("City").fill("Pune");
      await page.getByLabel("State").fill("Maharashtra");
      await page.getByLabel("Postal code").fill("411001");
      await page.getByLabel("Administrator email").fill(administratorEmail);
      await page.getByRole("button", { name: "Create organization" }).click();

      await expect(page).toHaveURL(/\/admin\/organizations\/[^/]+$/);
      await expect(page.getByRole("heading", { name: organizationName })).toBeVisible();
      await expect(page.getByText("Organization created.")).toBeVisible();
      organizationId = new URL(page.url()).pathname.split("/").pop() ?? "";
      expect(organizationId).not.toBe("");
    });

    let classId = "";
    await test.step("create an academic class and validate required fields", async () => {
      await page.goto("/admin/classes/new");
      await page.getByRole("button", { name: "Create class" }).click();
      await expect(page.getByText("Class name is required.")).toBeVisible();

      await page.getByLabel("Class name").fill("Class 6 QA");
      const organizationSelect = page.getByLabel("Organization");
      const optionValue = await organizationSelect
        .locator("option", { hasText: organizationName })
        .getAttribute("value");
      expect(optionValue).toBeTruthy();
      await organizationSelect.selectOption(optionValue ?? "");
      await page.getByLabel("Academic year").selectOption(academicYear);
      await page.getByRole("button", { name: "Create class" }).click();

      await expect(page).toHaveURL(/\/admin\/classes\/[^/]+$/);
      await expect(page.getByRole("heading", { name: "Class 6 QA" })).toBeVisible();
      classId = new URL(page.url()).pathname.split("/").pop() ?? "";
      expect(classId).not.toBe("");
    });

    let sectionId = "";
    await test.step("create a section inside the class", async () => {
      await page.goto(`/admin/sections/new?classId=${classId}`);
      await page.getByLabel("Section name").fill("Section QA");
      await page.getByRole("button", { name: "Create section" }).click();

      await expect(page).toHaveURL(/\/admin\/sections\/[^/]+$/);
      await expect(page.getByRole("heading", { name: "Section QA" })).toBeVisible();
      sectionId = new URL(page.url()).pathname.split("/").pop() ?? "";
      expect(sectionId).not.toBe("");
    });

    await test.step("create a student and assign them to the section roster", async () => {
      await page.goto("/admin/users/new?role=STUDENT");
      await page.getByLabel("First name").fill("QA");
      await page.getByLabel("Last name").fill("Student");
      await page.getByLabel("Email address").fill(studentEmail);
      await page.getByLabel("Username").fill(`qa.student.${suffix}`);
      const organizationSelect = page.getByLabel("Organization");
      const optionValue = await organizationSelect
        .locator("option", { hasText: organizationName })
        .getAttribute("value");
      await organizationSelect.selectOption(optionValue ?? "");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page).toHaveURL(/\/admin\/users\/[^/]+$/);
      await expect(page.getByRole("heading", { name: "QA Student", level: 1 })).toBeVisible();

      await page.goto(`/admin/sections/${sectionId}`);
      await expect(page.getByRole("heading", { name: "Section QA" })).toBeVisible();
      await page.getByRole("button", { name: "Assign students" }).first().click();

      const dialog = page.getByRole("dialog", { name: "Assign students" });
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("Search people").fill("QA Student");
      await dialog.getByRole("checkbox").first().check();
      await dialog.getByRole("button", { name: /Assign 1 students/ }).click();

      await expect(page.getByText("1 students assigned.")).toBeVisible();
      await expect(page.getByText("QA Student").first()).toBeVisible();
    });

    let courseId = "";
    await test.step("create an active course and allocate it to the organization", async () => {
      await page.goto("/admin/courses/new");
      await page.getByLabel("Course title").fill(courseTitle);
      await page.getByLabel("Category").fill("Quality Assurance");
      await page.getByLabel("Status").selectOption("ACTIVE");
      await page
        .getByLabel("Description")
        .fill("An end-to-end course used to verify the catalog and allocation workflow.");
      await page.getByLabel("Programming language").selectOption("PYTHON");
      await page.getByLabel("Difficulty").selectOption("BEGINNER");
      await page.getByRole("button", { name: "Create course" }).click();

      await expect(page).toHaveURL(/\/admin\/courses\/[^/]+$/);
      await expect(page.getByRole("heading", { name: courseTitle })).toBeVisible();
      courseId = new URL(page.url()).pathname.split("/").pop() ?? "";
      expect(courseId).not.toBe("");

      await page.goto(
        `/admin/allocations/new?courseId=${courseId}&organizationId=${organizationId}`,
      );
      await page.getByLabel("Scope").selectOption("ORGANIZATION");
      await page.getByRole("button", { name: "Review allocation" }).click();

      const confirmDialog = page.getByRole("dialog", { name: "Confirm course allocation" });
      await expect(confirmDialog).toBeVisible();
      await confirmDialog.getByRole("button", { name: "Create allocation" }).click();

      await expect(page).toHaveURL(/\/admin\/allocations\/[^/]+$/);
      await expect(page.getByRole("heading", { name: courseTitle })).toBeVisible();
    });

    await test.step("create, resend and revoke a mock invitation", async () => {
      await page.goto("/admin/invitations");
      await page.getByRole("button", { name: "New invitation" }).first().click();

      const dialog = page.getByRole("dialog", { name: "Invite a new member" });
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("Email address").fill(inviteEmail);
      await dialog.getByLabel("Role").selectOption("TEACHER");
      const organizationSelect = dialog.getByLabel("Organization");
      const optionValue = await organizationSelect
        .locator("option", { hasText: organizationName })
        .getAttribute("value");
      await organizationSelect.selectOption(optionValue ?? "");
      await dialog.getByRole("button", { name: "Create invitation" }).click();

      await expect(
        page.getByText(`Invitation created for ${inviteEmail}. No email was sent`),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: `Actions for ${inviteEmail}` })).toBeVisible();

      await page.getByRole("button", { name: `Actions for ${inviteEmail}` }).click();
      await page.getByRole("menuitem", { name: "Resend invitation" }).click();
      const resendDialog = page.getByRole("dialog", { name: "Resend invitation?" });
      await resendDialog.getByRole("button", { name: "Resend invitation" }).click();
      await expect(page.getByText("Invitation marked as resent. No email was sent.")).toBeVisible();

      await page.getByRole("button", { name: `Actions for ${inviteEmail}` }).click();
      await page.getByRole("menuitem", { name: "Revoke invitation" }).click();
      const revokeDialog = page.getByRole("dialog", { name: "Revoke invitation?" });
      await revokeDialog.getByRole("button", { name: "Revoke invitation" }).click();
      await expect(page.getByText("Invitation revoked.")).toBeVisible();
    });

    await test.step("review reports, audit history and global search", async () => {
      await page.goto("/admin/reports");
      await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
      await page.getByRole("link", { name: /Organization-wise student count/ }).click();
      await expect(page).toHaveURL(/\/admin\/reports\/organization-students$/);
      await expect(
        page.getByRole("heading", { name: "Organization-wise student count" }),
      ).toBeVisible();
      await expect(page.getByText(organizationName).first()).toBeVisible();

      await page.goto("/admin/audit-logs");
      await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
      await page
        .getByPlaceholder("Search actor, action, entity, organization or correlation ID…")
        .fill(organizationName);
      await expect(page.getByText("Organization created").first()).toBeVisible();

      await page.goto("/admin/search");
      await page.getByLabel("Search the platform").fill(organizationName);
      await expect(page.getByText(organizationName).first()).toBeVisible();
    });

    await test.step("save settings and reset the demo dataset", async () => {
      await page.goto("/admin/settings");
      await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

      await page.getByLabel("Platform name").fill(`L_Platform ${suffix}`);
      await page.getByRole("button", { name: "Save settings" }).click();
      await expect(page.getByText("Settings saved.")).toBeVisible();

      await page.getByRole("button", { name: "Reset demo data" }).first().click();
      const resetDialog = page.getByRole("dialog", { name: "Reset all demo data?" });
      await resetDialog.getByRole("button", { name: "Reset demo data" }).click();
      await expect(page.getByText("Demo data restored from the seed dataset.")).toBeVisible();
    });
  });
});
