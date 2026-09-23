// H12 — the frontend's first unit test. Run with a fixed timezone so the
// bug (toISOString() converts to UTC before slicing, which is wrong in any
// zone ahead of UTC) is actually exercised the same way in CI as it was
// found in Manila:
//
//   TZ=Asia/Manila CI=true npx react-scripts test --watchAll=false src/utils/dates.test.js

import { toLocalDateString } from "./dates";

describe("toLocalDateString", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("07:30 Manila time returns today, not yesterday (the original bug)", () => {
    // The exact failure window: toISOString() at 07:30 local (UTC+8) lands
    // on 23:30 UTC the PREVIOUS day, so the old `.toISOString().slice(0,10)`
    // pattern returned "2026-01-14" here instead of "2026-01-15".
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 15, 7, 30, 0));
    expect(toLocalDateString()).toBe("2026-01-15");
  });

  test("the first of a month is not shown as the last day of the prior month", () => {
    // A date built at local midnight (new Date(y, m, 1)) is ALWAYS one day
    // early under toISOString() in a UTC+ zone, regardless of the hour —
    // this is the bank-reconciliation "start of month" bug specifically.
    const firstOfJune = new Date(2026, 5, 1);
    expect(toLocalDateString(firstOfJune)).toBe("2026-06-01");
  });

  test("the last day of a month is not shown as the first of the next month", () => {
    const lastDayOfJune = new Date(2026, 5, 30);
    expect(toLocalDateString(lastDayOfJune)).toBe("2026-06-30");
  });
});
