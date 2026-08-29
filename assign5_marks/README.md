# Assignment 5 — VIT Semester Result using **React + Spring Boot + MongoDB**

> **Technology: a React (Vite) single page app talking over REST to a Spring Boot
> service that stores marks in MongoDB.**
> Three tiers, one job: take MSE and ESE marks for four subjects and prepare the
> semester result — grade per subject, percentage, SGPA and pass/fail.

## The marks scheme

Each subject is out of 100, split by the required weightage:

| Head | Out of | Weightage |
| ---- | ------ | --------- |
| MSE (Mid Semester Exam) | 30 | **30 %** |
| ESE (End Semester Exam) | 70 | **70 %** |

## The four subjects

| Code | Subject | Credits |
| ---- | ------- | ------- |
| CS3001 | Web Technologies | 4 |
| CS3002 | Database Management Systems | 4 |
| CS3003 | Computer Networks | 3 |
| CS3004 | Software Engineering | 3 |
| | **Total** | **14** |

## Grading scale

A subject's `MSE + ESE` total decides its grade; the grade decides the points.

| Total | Grade | Points |
| ----- | ----- | ------ |
| 90 – 100 | AA | 10 |
| 80 – 89 | AB | 9 |
| 70 – 79 | BB | 8 |
| 60 – 69 | BC | 7 |
| 50 – 59 | CC | 6 |
| 45 – 49 | CD | 5 |
| 40 – 44 | DD | 4 |
| below 40 | FF | 0 (backlog) |

```
SGPA = Σ (credits × grade points) / Σ credits
```

A student passes the semester only if no subject lands on FF.

## Running it

Two processes. **MongoDB is the only thing you may need to install** — and even
that has a way out (see below).

### 1. The API

```bash
cd backend
./mvnw spring-boot:run
```

`backend/` is an ordinary Maven Spring Boot project, so Spring Tool Suite (or
IntelliJ, or VS Code) opens it with **Import → Existing Maven Projects**; the
Maven wrapper above is just a way to run it without installing Maven first.

It listens on <http://localhost:8080> and expects MongoDB on
`mongodb://localhost:27017/vit_results`. Point it somewhere else — a different
server, or MongoDB Atlas — with an environment variable:

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/vit_results" ./mvnw spring-boot:run
```

**No MongoDB installed?** The `embedded` profile downloads a throwaway one,
starts it, and seeds three sample students. Nothing is written to disk:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=embedded
```

### 2. The web app

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to port 8080, so the browser
only ever talks to one origin.

## The REST API

| Method | Path | Does |
| ------ | ---- | ---- |
| `GET` | `/api/syllabus` | the four subjects, the mark ceilings and the grading scale |
| `GET` | `/api/results` | every prepared result, by name |
| `GET` | `/api/results/{prn}` | one student's result |
| `POST` | `/api/results` | file marks for a student (same PRN overwrites) |
| `DELETE` | `/api/results/{prn}` | remove a student's result |

```bash
curl -X POST http://localhost:8080/api/results \
  -H 'Content-Type: application/json' \
  -d '{"prn":"20221004","name":"Sanika Joshi","branch":"Computer Engineering","division":"A",
       "subjects":[
         {"code":"CS3001","name":"Web Technologies","credits":4,"mse":27,"ese":62},
         {"code":"CS3002","name":"Database Management Systems","credits":4,"mse":25,"ese":55},
         {"code":"CS3003","name":"Computer Networks","credits":3,"mse":23,"ese":51},
         {"code":"CS3004","name":"Software Engineering","credits":3,"mse":26,"ese":58}]}'
```

## How it is put together

```
assign5_marks/
├── backend/          Spring Boot 3.5 · Java 17 · Spring Data MongoDB
│   └── src/main/java/com/vit/results/
│       ├── model/        StudentResult, SubjectMarks  — what MongoDB stores
│       ├── repository/   StudentResultRepository      — Spring Data queries
│       ├── service/      Grade, SubjectCatalog, ResultService — the arithmetic
│       └── web/          ResultController, ResultCard, ApiExceptionHandler
└── frontend/         React 18 · Vite
    └── src/
        ├── api.js          fetch wrapper over the five endpoints
        ├── grading.js      the live preview's arithmetic
        └── components/     MarksForm, ResultList, Marksheet
```

### Only raw marks are stored

A document in the `results` collection holds the student and their eight
numbers — nothing else:

```json
{
  "prn": "20221001",
  "name": "Aarav Deshmukh",
  "branch": "Computer Engineering",
  "division": "A",
  "subjects": [{ "code": "CS3001", "name": "Web Technologies", "credits": 4, "mse": 26, "ese": 61 }],
  "updatedAt": "2026-08-29T03:17:48.230Z"
}
```

Grades, percentage and SGPA are **derived on every read** by
[`ResultService.prepare`](backend/src/main/java/com/vit/results/service/ResultService.java).
Change a band in the [`Grade`](backend/src/main/java/com/vit/results/service/Grade.java)
enum and every result already in the database reflects it — no migration, and no
way for a stored grade to drift out of step with the marks it came from.

### One grading scale, not two

The form grades each row as you type. Rather than hard code the scale a second
time in JavaScript, the React app asks `GET /api/syllabus` for it and
[`grading.js`](frontend/src/grading.js) applies the bands the server sent. The
preview and the stored result cannot disagree.

A row stays ungraded (`—`) until both of its marks are present **and** in range,
so an untouched form does not announce four backlogs and an impossible `40 / 90`
is never dressed up as a grade.

### Validation on both sides

The browser checks before it posts; the server checks again with Bean Validation
(`@Pattern` on the PRN, `@Min`/`@Max` on every mark, exactly four subjects) and
returns a field-keyed 400 that the app shows against the offending inputs.

```json
{ "message": "Please correct the highlighted fields.",
  "fields": { "prn": "PRN must be 8 to 12 digits", "subjects[0].ese": "ESE marks cannot exceed 70" } }
```

## Responsive

One breakpoint does the real work. Below 560px each table row stops being a row
and becomes its own labelled block — the `data-label` on every cell is what the
CSS prints as the heading — so the marksheet reads top to bottom on a phone
instead of scrolling sideways. The layout drops to a single column at 780px, and
`Print` on a marksheet hides everything but the sheet itself.

## Tests

```bash
cd backend && ./mvnw test
```

[`ResultPreparationTest`](backend/src/test/java/com/vit/results/service/ResultPreparationTest.java)
covers the arithmetic that matters: MSE + ESE totalling to 100, every grade
boundary, credit-weighted SGPA, and a backlog failing the semester.

## Screenshots

| | |
| --- | --- |
| ![Entry form](screenshots/01-entry-form.png) | ![Marksheet](screenshots/02-marksheet.png) |
| Marks entry, graded live as you type | The prepared result sheet |
| ![Backlog](screenshots/03-backlog.png) | ![Validation](screenshots/04-validation.png) |
| A student carrying a backlog | Validation, on the field that failed |
| ![Mobile form](screenshots/05-mobile-form.png) | ![Mobile marksheet](screenshots/06-mobile-marksheet.png) |
| Rows stack on a phone | …and so does the marksheet |

The collection behind it:

![The results collection](screenshots/07-mongodb.png)

![One stored document](screenshots/08-mongodb-document.png)

Only the raw marks are in the document — the grade, percentage and SGPA in the
screenshots above are computed from them on read.
