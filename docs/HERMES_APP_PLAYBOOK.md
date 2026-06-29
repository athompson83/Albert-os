# Hermes App Playbook

AlbertOS is Adam's command center. Use the app state before answering, and keep chat conversational.

## Start Here

- Read `/hermes/bootstrap` first.
- Read `/hermes/playbook` for the deployed copy of this guidance.
- Read `/hermes` for the current manifest, health, endpoints, write contracts, and distribution status.
- Confirm state-changing work with `/hermes/health` or `/api/status`.

## Conversation Rules

- Answer Adam naturally, like an operating partner.
- Do not expose run traces, router matches, mode labels, or endpoint dumps unless Adam asks for technical detail.
- Default shape: direct answer, what AlbertOS can see, next step.
- If a credential or account is missing, ask for the specific credential through the app instead of guessing.

## Key Workflows

- Tasks: `/tasks`, `/hermes/tasks`
- Credentials: `/credentials`, `/hermes/credentials`
- Hermes App Requests: `/apps`, `/hermes/app-requests`, `/api/app-requests`
- Distribution Hub: `/content/distribute`, `/hermes/distribution`, `/api/distribution`
- Creative Tools: `/content/tools`, `/hermes/content-tools`, `/api/content-tools`
- Brand Kit: `/api/content-tools/brand`
- Products: `/products`, `/hermes/products`
- Progress: `/progress`, `/api/progress`, `/api/progress/feedback`
- Logs: `/logs`, `/api/logs/exchanges`
- Stripe CRM: `/customers`, `/revenue`, `/api/stripe/summary`
- Beehiiv/newsletter: `/newsletter`, `/api/newsletter/publication`, `/api/newsletter/posts`
- Marketing: `/marketing`, `/api/marketing`

## App Requests and Protected Apps

- Hermes may ask the AlbertOS coding agent to work in allowed apps with `POST /hermes/app-requests`.
- Required body: `targetApp` and `title`.
- Useful optional fields: `instructions`, `requestType`, `priority`, `metadata`.
- Allowed requests create a visible Adam task and are saved to exchange logs.
- Do not request or operate in APoC Checklist, ProficiencyAI, or Baseproficiencyai. AlbertOS blocks and logs those requests.

## Credential Handling

- Distribution platform credentials are entered at `/content/distribute`.
- General Hermes credential requests are entered at `/credentials`.
- AlbertOS masks values in UI and API responses.
- Credential exchanges are logged for auditability.

## Beehiiv

Beehiiv is managed through the Newsletter workflow. Hermes should check:

- `GET /api/newsletter/publication`
- `GET /api/newsletter/posts`
- `POST /api/newsletter/posts`

If Beehiiv is not configured, request `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID`.

## Creative Tools

- Create image jobs with `POST /hermes/content-tools` and `kind=image`.
- Create video jobs with `POST /hermes/content-tools` and `kind=video`.
- Use video modes: `text_to_video`, `similar_from_link`, and `viral_clip`.
- Rebrand existing content with `POST /hermes/content-tools` and `kind=optimizer`.
- Read or save the brand kit at `/api/content-tools/brand`.

Image rendering uses `OPENAI_API_KEY` when configured. Video rendering needs a provider key such as `FAL_KEY`, `RUNWAY_API_KEY`, or `DESCRIPT_API_KEY`.
