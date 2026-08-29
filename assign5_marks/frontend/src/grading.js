/**
 * Mirrors the server's scale using the bands the API hands over, so the live
 * preview in the form never disagrees with the stored result.
 */
export function gradeFor(total, bands) {
  return bands.find((band) => total >= band.minTotal) ?? null
}

const inRange = (value, max) => {
  if (value === '') return false
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 && number <= max
}

/**
 * Grades a form in progress. A subject is only graded once both of its marks
 * are present and inside the allowed range, so an untouched form does not claim
 * four backlogs and an impossible 40/90 is never dressed up as a grade. The
 * totals stay flagged incomplete until every subject is usable.
 */
export function previewResult(rows, bands, { mseMax, eseMax }) {
  let totalMarks = 0
  let totalCredits = 0
  let points = 0
  let backlogs = 0
  let complete = true

  const subjects = rows.map((row) => {
    if (!inRange(row.mse, mseMax) || !inRange(row.ese, eseMax)) {
      complete = false
      return { ...row, mse: null, ese: null, total: null, grade: null, gradePoints: 0 }
    }

    const mse = Number(row.mse)
    const ese = Number(row.ese)
    const total = mse + ese
    const band = gradeFor(total, bands)

    totalMarks += total
    totalCredits += row.credits
    points += row.credits * (band?.points ?? 0)
    if (band && band.points === 0) backlogs += 1

    return { ...row, mse, ese, total, grade: band?.code ?? null, gradePoints: band?.points ?? 0 }
  })

  return {
    subjects,
    complete,
    totalMarks,
    totalCredits,
    backlogs,
    sgpa: totalCredits ? round2(points / totalCredits) : 0,
  }
}

const round2 = (value) => Math.round(value * 100) / 100
