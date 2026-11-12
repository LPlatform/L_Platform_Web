import { expect, test } from "@playwright/test";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

test.describe("role boundaries & desktop gating", () => {
  test("redirects unauthenticated teacher routes to login", async ({ page }) => {
    await page.goto("/teacher/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fteacher%2Fdashboard/);
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("blocks student accounts from signing into the web portal", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("student1@riverside.edu");
    await page.getByLabel("Password", { exact: true }).fill("Student@123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/Student Desktop application/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("restricts platform developers to platform curriculum routes", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("developer@lplatform.dev");
    await page.getByLabel("Password", { exact: true }).fill("Dev@123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/admin\/courses/);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/courses/);
  });
});

test.describe("teacher curriculum, >3-question assignments, assessments, and grading", () => {
  test("completes full teacher portal authoring and grading workflow against live backend", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const suffix = Date.now().toString(36);
    const createdQuestionTitle = `E2E Ethical AI Tradeoff ${suffix}`;
    const assignmentTitle = `E2E Case Study 5Q ${suffix}`;
    const assessmentTitle = `E2E Module 2 Checkpoint ${suffix}`;

    await test.step("sign in as teacher and verify admin route boundary", async () => {
      await page.goto("/login");
      await page.getByLabel("Email Address").fill("teacher@riverside.edu");
      await page.getByLabel("Password", { exact: true }).fill("Teacher@123");
      await page.getByRole("button", { name: "Sign In" }).click();

      await expect(page).toHaveURL(/\/teacher\/dashboard/);
      await page.goto("/admin/dashboard");
      await expect(page).toHaveURL(/\/teacher\/dashboard/);
    });

    await test.step("browse AI Readiness course and navigate directly to module questions", async () => {
      await page.goto("/teacher/ai-readiness");
      await expect(page.getByRole("heading", { name: /AI Readiness Course/i })).toBeVisible();
      await page.getByRole("link", { name: "Browse Module Questions" }).click();
      await expect(page).toHaveURL(/\/teacher\/questions\?courseModuleId=m1-ai-foundations/);
    });

    await test.step("browse full 352+ question bank and inspect question details", async () => {
      await page.goto("/teacher/questions");
      const countHeading = page.getByText(/All Questions \(\d+\)/);
      await expect(countHeading).toBeVisible();
      const text = await countHeading.textContent();
      const match = text?.match(/\((\d+)\)/);
      const count = match ? Number(match[1]) : 0;
      expect(count).toBeGreaterThanOrEqual(352);

      await page.getByLabel("Filter by module").selectOption("m1-ai-foundations");
      await page.getByLabel("Filter by question type").selectOption("SINGLE_MCQ");
      await page
        .getByRole("button", { name: /Inspect/i })
        .first()
        .click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(/CBSE AI Student Handbook|Prompt/i).first()).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });

    await test.step("author a new SHORT_ANSWER question", async () => {
      await page.goto("/teacher/questions/new");
      await page.getByLabel("Question Type *").selectOption("SHORT_ANSWER");
      await page.getByLabel("AI Readiness Module (Optional)").selectOption("m8-ai-ethics");
      await page.getByLabel("Question Title *").fill(createdQuestionTitle);
      await page
        .getByLabel("Question Prompt / Problem Statement *")
        .fill("Explain why human-in-the-loop review prevents automated triage errors.");
      await page.getByLabel("Marks").fill("10");
      await page.getByRole("button", { name: "Save Question" }).click();

      await expect(page).toHaveURL(/\/teacher\/questions/);
      await page
        .getByPlaceholder("Search by title, topic, or reference...")
        .fill(createdQuestionTitle);
      await expect(page.getByText(createdQuestionTitle)).toBeVisible();
    });

    let createdAssignmentId = "";
    await test.step("create and publish a CASE_STUDY assignment with >3 questions (5 selected)", async () => {
      await page.goto("/teacher/assignments/new");
      await expect(page.getByText(/Select Questions \(0 selected/)).toBeVisible();
      await page.getByLabel("Assignment Title *").fill(assignmentTitle);
      await page.getByLabel("Assignment Type *").selectOption("CASE_STUDY");
      await page.getByLabel("Target Section *").selectOption("sec-grade10a-001");
      await page
        .getByLabel("Instructions & Guidelines")
        .fill("Analyze each question clearly referencing course concepts.");

      // Filter to short answer questions or Module 8 so selection is fast and deterministic
      await page.getByLabel("Filter by AI Readiness module").selectOption("m8-ai-ethics");
      const questionRows = page
        .locator("form button")
        .filter({ has: page.locator("input[type='checkbox']") });
      await expect(questionRows.first()).toBeVisible();

      for (let i = 0; i < 5; i++) {
        await questionRows.nth(i).click();
      }
      await expect(page.getByText(/Select Questions \(5 selected/)).toBeVisible();

      await page.getByRole("button", { name: "Publish Assignment" }).click();
      await expect(page).toHaveURL(/\/teacher\/assignments$/);
      await expect(page.getByRole("link", { name: assignmentTitle })).toBeVisible();

      await page.getByRole("link", { name: assignmentTitle }).click();
      await expect(page).toHaveURL(/\/teacher\/assignments\/asg-[^/]+$/);
      createdAssignmentId = new URL(page.url()).pathname.split("/").pop() ?? "";
      expect(createdAssignmentId).toMatch(/^asg-/);
      await expect(page.getByText("Included Questions (5)")).toBeVisible();
      await expect(page.getByText("CASE_STUDY")).toBeVisible();
    });

    await test.step("submit as student via backend API then grade and release feedback in Teacher UI", async () => {
      const loginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: "student1@riverside.edu", password: "Student@123" },
      });
      expect(loginRes.ok()).toBeTruthy();

      const asgDetailRes = await request.get(`${API_URL}/api/assignments/${createdAssignmentId}`);
      expect(asgDetailRes.ok()).toBeTruthy();
      const asgDetail = (await asgDetailRes.json()) as {
        questions: Array<{ id: string; title: string }>;
      };
      expect(asgDetail.questions.length).toBe(5);

      const firstQuestion = asgDetail.questions[0];
      const submitRes = await request.post(`${API_URL}/api/submissions`, {
        data: {
          assignmentId: createdAssignmentId,
          questionId: firstQuestion.id,
          textResponse:
            "Human oversight ensures high-stakes AI outputs undergo domain verification.",
        },
      });
      expect(submitRes.status()).toBe(202);

      await page.goto(
        `/teacher/submissions?assignmentId=${encodeURIComponent(createdAssignmentId)}`,
      );
      await expect(page.getByText(firstQuestion.title).first()).toBeVisible();
      await page.getByRole("button", { name: "Inspect & Grade" }).first().click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();
      await expect(
        modal.getByText(/Human oversight ensures high-stakes AI outputs/i),
      ).toBeVisible();
      await modal.getByLabel("Score (marks)").fill("1");
      await modal.getByLabel("Teacher Feedback").fill("Clear explanation of oversight checks.");
      await modal.getByRole("button", { name: "Save Grade & Feedback" }).click();

      await expect(modal).toBeHidden();
      await expect(page.getByText("Released").first()).toBeVisible();
    });

    await test.step("build and publish an assessment through the 3-step wizard", async () => {
      await page.goto("/teacher/assessments/new");
      await page.getByLabel("Assessment Title *").fill(assessmentTitle);
      await page.getByRole("button", { name: "Next: Select Questions" }).click();

      await page.getByRole("button", { name: "Filter to Target Module" }).click();
      const step2Rows = page
        .locator("button")
        .filter({ has: page.locator("input[type='checkbox']") });
      await expect(step2Rows.first()).toBeVisible();
      await step2Rows.nth(0).click();
      await step2Rows.nth(1).click();

      await page.getByRole("button", { name: "Next: Assign & Review" }).click();
      await page.getByRole("button", { name: "Create & Publish Assessment" }).click();

      await expect(page).toHaveURL(/\/teacher\/assessments\/asmt-[^/]+$/);
      await expect(page.getByRole("heading", { name: assessmentTitle })).toBeVisible();
    });
  });
});
