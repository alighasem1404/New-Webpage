# Website Launch Backlog

This file is the working task list for preparing the Verseluft website for launch. It is written so an AI assistant can pick up the work from this file without needing the original chat.

## How to use this backlog

- All tasks start as **Not started**.
- Work on only the task the user asks for. If the user says “start the next Must have,” take the first unfinished Must have in the order below.
- Do not start or change other tasks unless the user asks. Tell the user if the requested task depends on another unfinished task.
- After completing a task, update its status here to **Done** and add a short note describing what changed. If work is partial or blocked, use **In progress** or **Blocked** and explain why.
- Keep the task IDs stable so the user can request a task by ID, such as “Start M03.”
- Estimates are approximate hands-on developer time, including a basic check. They are not calendar-time promises.
- If two tasks turn out to describe the same issue, confirm the overlap in the implementation notes and avoid doing duplicate work.

## Must have

Launch-critical functionality, content access, readability, and layout.

| ID | Task | Estimate | Status | Implementation notes |
|---|---|---:|---|---|
| M01 | Make the site responsive on mobile, tablet, and desktop. | 4–8 hours | Not started | Check the main pages and common screen sizes. |
| M02 | Temporarily hide sections that do not have content yet. | 30–90 min | Not started | Keep empty or placeholder content out of the launch experience. |
| M03 | Make text at the bottom of the page readable, including its hover state. | 30–90 min | Not started | Check text/background contrast and hover styling. |
| M04 | Fix broken buttons so they work or lead somewhere useful. | 1–2 hours | Not started | This refers to broken buttons generally; Contact CTAs and the Contact page button have separate items below. |
| M05 | Make the intended content cards clickable. | 1–2 hours | Not started | Apply only to cards that are meant to open a page or item. |
| M06 | Fix broken call-to-action buttons, including Contact CTAs. | 30–90 min | Not started | Check CTA destinations and click behavior throughout the site. |
| M07 | Let visitors minimize or close the full-screen Library PDF viewer. | 2–4 hours | Not started | Preserve a clear way to return to the Library page. |
| M08 | Fix the vertical text on the About Us page. | 30–60 min | Not started |  |
| M09 | Fix the About Us layout and move the top border to its intended position. | 1–2 hours | Not started |  |
| M10 | Fix the non-working button on the Contact page. | 30–90 min | Not started | This may overlap with M04 or M06; inspect the actual button before changing code. |
| M11 | Make current projects clickable. | 1–2 hours | Not started | Link each project to its intended destination. |
| M12 | Make each “View Book” button open the correct page for that book. | 1–3 hours | Not started | If a real book page does not exist, report that dependency and propose a useful destination. |
| M13 | Improve the position and readability of descriptions beside titles on the home page. | 1–2 hours | Not started |  |
| M14 | Make search behave as expected, or hide it until it is ready. | 2–4 hours | Not started | Do not leave a visible search control that does not work. |

**Estimated Must-have effort: about 18–37 hours.**

## Good to have

Visual consistency and polish that can follow the launch-critical fixes.

| ID | Task | Estimate | Status | Implementation notes |
|---|---|---:|---|---|
| G01 | Adjust font sizes across the site. | 1–3 hours | Not started | Agree on a consistent type scale while preserving readability. |
| G02 | Make full-page background sections consistent in size and coverage. | 1–3 hours | Not started |  |
| G03 | Add hover animations to buttons. | 30–90 min | Not started | Keep the effect subtle and preserve keyboard focus feedback. |
| G04 | Make font sizes and spacing consistent inside buttons. | 30–90 min | Not started |  |
| G05 | Restyle About Us panels so they do not look like buttons. | 30–60 min | Not started | Keep button styling for genuinely interactive elements. |
| G06 | Keep Upcoming Books in a consistent order while browsing. | 30–90 min | Not started | Preserve the intended order when the carousel advances. |
| G07 | Improve the size and placement of arrows beside call-to-action buttons. | 30–90 min | Not started |  |
| G08 | Refresh the visual design of the Projects page. | 2–5 hours | Not started | Keep project information and links easy to scan. |
| G09 | Adjust the size of the numbers at the top of the Blog page. | 30–60 min | Not started |  |
| G10 | Correct the position of the “View Book” button in the Library. | 30–60 min | Not started | Separate from M12, which fixes where the button leads. |
| G11 | Put a plus sign before the statistics on the home page. | 15–30 min | Not started | Example: “90+” rather than “+90,” if that matches the intended design. |

**Estimated Good-to-have effort: about 7–21 hours.**

## Overall estimate

About **25–58 hours** of developer time for all listed tasks. The largest uncertainty is how much responsive layout and visual redesign work the pages need.
