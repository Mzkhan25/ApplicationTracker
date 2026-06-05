import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/dashboard/Panel';

/** Inline reference to a UI control (button label, menu item, field). */
function Ui({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function Step({ children }: { children: ReactNode }) {
  return <li className="leading-relaxed text-slate-600">{children}</li>;
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">How to use</h1>
        <p className="text-sm text-slate-500">
          Everything this app can do, and how to do it. Track where you applied,
          the role, and how far each application has progressed.
        </p>
      </div>

      {/* The basics */}
      <Panel title="The basics">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            The app has two main views, switchable from the top navigation:
          </p>
          <ul className="space-y-2">
            <Step>
              <strong className="text-slate-700">Board</strong> — a Jira-style
              Kanban board. Each application is a card; each column is a status
              stage. This is where you add applications and move them along.
            </Step>
            <Step>
              <strong className="text-slate-700">Dashboard</strong> — an overview
              of your pipeline: totals, distribution across stages, recent
              activity, and follow-up reminders.
            </Step>
          </ul>
          <p className="text-slate-600">
            On first run the app is pre-filled with a few sample applications so
            nothing looks empty — feel free to edit or delete them.
          </p>
        </div>
      </Panel>

      {/* Adding & editing applications */}
      <Panel title="Adding & editing applications">
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-1 font-semibold text-slate-700">
              Add an application
            </h3>
            <ul className="ml-4 list-disc space-y-1.5">
              <Step>
                Click <Ui>+ New application</Ui> at the top of the{' '}
                <Link to="/board" className="text-brand-600 hover:underline">
                  Board
                </Link>
                , or <Ui>+ Add application</Ui> at the bottom of a specific
                column to start it in that stage.
              </Step>
              <Step>
                Fill in the form. <strong className="text-slate-700">Company</strong>{' '}
                and <strong className="text-slate-700">Role</strong> are
                required; everything else is optional.
              </Step>
              <Step>
                Click <Ui>Add application</Ui> — the card appears in its column
                and the dashboard updates immediately.
              </Step>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-slate-700">
              Fields on a card
            </h3>
            <p className="mb-1 text-slate-500">
              All amounts are shown in euros (€).
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <Step>
                <strong className="text-slate-700">Company / Role</strong> —
                shown on the card face (required).
              </Step>
              <Step>
                <strong className="text-slate-700">Stage</strong> — which column
                the card lives in (its status).
              </Step>
              <Step>
                <strong className="text-slate-700">Applied date</strong> —
                defaults to today; shown as “Applied Jun 4” on the card.
              </Step>
              <Step>
                <strong className="text-slate-700">Priority</strong> — High,
                Medium, or Low, shown as a colored tag (red / amber / slate).
              </Step>
              <Step>
                <strong className="text-slate-700">Work mode</strong> — Remote,
                Hybrid, or Onsite (optional).
              </Step>
              <Step>
                <strong className="text-slate-700">Location</strong>,{' '}
                <strong className="text-slate-700">Job posting URL</strong>, and{' '}
                <strong className="text-slate-700">Salary min/max</strong> — the
                role’s posted range (e.g. “€120k–150k”).
              </Step>
              <Step>
                <strong className="text-slate-700">Demanded salary</strong> — the
                salary you’re asking for (shown exactly, not rounded). Appears
                prominently on the card as a badge like “Asking €130,000”,
                separate from the posted range.
              </Step>
              <Step>
                <strong className="text-slate-700">Notes</strong> — free text for
                interview details, contacts, follow-ups (optional).
              </Step>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-slate-700">Edit or delete</h3>
            <ul className="ml-4 list-disc space-y-1.5">
              <Step>
                <strong className="text-slate-700">Edit:</strong> click anywhere
                on a card’s body to open it, change fields, then <Ui>Save</Ui>.
              </Step>
              <Step>
                <strong className="text-slate-700">Delete:</strong> open the card
                and click <Ui>Delete</Ui> (bottom-left of the dialog).
              </Step>
            </ul>
          </div>
        </div>
      </Panel>

      {/* Moving applications */}
      <Panel title="Moving applications between stages">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            Changing an application’s status means moving its card to another
            column.
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>
              <strong className="text-slate-700">Drag &amp; drop:</strong> grab
              the dotted grip handle on the right of a card and drag it to
              another column, or to a new position within the same column. The
              status updates and is saved automatically.
            </Step>
            <Step>
              <strong className="text-slate-700">Keyboard:</strong> Tab to a
              card’s grip handle, press <Ui>Space</Ui> to pick it up, use the
              arrow keys to move, and <Ui>Space</Ui> again to drop.
            </Step>
            <Step>
              You can also change the stage from the edit dialog using the{' '}
              <strong className="text-slate-700">Stage</strong> dropdown.
            </Step>
          </ul>
        </div>
      </Panel>

      {/* Columns / stages */}
      <Panel title="Customizing the pipeline (columns)">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            Columns are your status stages. Defaults are{' '}
            <em>Applied → Phone Screen → Interview → Offer → Rejected</em>, but
            you can change them freely. Open a column’s{' '}
            <Ui>⋮</Ui> menu (top-right of the column) for these actions:
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>
              <strong className="text-slate-700">Add a column:</strong> click{' '}
              <Ui>+ Add column</Ui> at the far right of the board and type a
              name.
            </Step>
            <Step>
              <strong className="text-slate-700">Rename:</strong> <Ui>⋮</Ui> →{' '}
              <Ui>Rename</Ui>, edit the name inline, press Enter.
            </Step>
            <Step>
              <strong className="text-slate-700">Reorder:</strong> <Ui>⋮</Ui> →{' '}
              <Ui>Move left</Ui> / <Ui>Move right</Ui>.
            </Step>
            <Step>
              <strong className="text-slate-700">Delete:</strong> <Ui>⋮</Ui> →{' '}
              <Ui>Delete</Ui>. Any cards in that column are moved to the first
              column so nothing is lost. You can’t delete the last remaining
              column.
            </Step>
          </ul>
        </div>
      </Panel>

      {/* Follow-up reminders */}
      <Panel title="Follow-up reminders">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            Each column can flag applications that have gone too long without an
            update, so you know when to follow up.
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>
              <strong className="text-slate-700">Set a window:</strong> column{' '}
              <Ui>⋮</Ui> → <Ui>Follow-up reminder…</Ui>, then enter a number of
              days. A small ⏰ badge appears in the column header showing the
              window. Leave the field blank to turn reminders off for that
              column.
            </Step>
            <Step>
              <strong className="text-slate-700">How flagging works:</strong> an
              application is “due” when the days since its last change exceed its
              column’s window. Defaults: Applied 14 days, Phone Screen 7,
              Interview 5; Offer and Rejected have no reminders (they’re terminal
              stages).
            </Step>
            <Step>
              <strong className="text-slate-700">Where they show:</strong> the
              Dashboard’s <em>Follow-up reminders</em> panel lists everything
              due, most overdue first.
            </Step>
            <Step>
              <strong className="text-slate-700">Clearing one:</strong> click{' '}
              <Ui>Done</Ui> next to a reminder — this marks the application as
              just-updated, resetting its timer (it doesn’t change the stage).
            </Step>
          </ul>
        </div>
      </Panel>

      {/* Dashboard */}
      <Panel title="Reading the dashboard">
        <div className="space-y-3 text-sm">
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>
              <strong className="text-slate-700">Stat tiles:</strong>{' '}
              <em>Applications</em> (total), <em>Response rate</em> (share that
              moved past the first stage), <em>Companies</em> (distinct
              employers), and <em>Follow-ups due</em>.
            </Step>
            <Step>
              <strong className="text-slate-700">Applications by stage:</strong>{' '}
              bars showing how many cards are in each column — magnitude, scaled
              to the busiest column.
            </Step>
            <Step>
              <strong className="text-slate-700">Pipeline breakdown:</strong> a
              donut showing each stage’s <em>share</em> of all applications, with
              the total in the center and a legend (count and %).
            </Step>
            <Step>
              <strong className="text-slate-700">Recent activity:</strong> the
              applications you changed most recently.
            </Step>
            <Step>
              <strong className="text-slate-700">Follow-up reminders:</strong>{' '}
              applications past their stage’s reminder window (see above).
            </Step>
          </ul>
        </div>
      </Panel>

      {/* Data & storage */}
      <Panel title="Your data & privacy">
        <div className="space-y-3 text-sm">
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>
              All data is stored <strong className="text-slate-700">locally in
              your browser</strong> (no account, no server). Nothing leaves your
              device.
            </Step>
            <Step>
              Because it’s per-browser, your data{' '}
              <strong className="text-slate-700">won’t sync</strong> across
              devices or browsers, and clearing your browser’s site data for this
              app will erase it.
            </Step>
            <Step>
              Every change is saved automatically — there’s no “save” button for
              the board as a whole.
            </Step>
          </ul>
        </div>
      </Panel>

      <p className="pb-2 text-center text-xs text-slate-400">
        Ready to start? Head to the{' '}
        <Link to="/board" className="text-brand-600 hover:underline">
          Board
        </Link>{' '}
        or the{' '}
        <Link to="/" className="text-brand-600 hover:underline">
          Dashboard
        </Link>
        .
      </p>
    </div>
  );
}
