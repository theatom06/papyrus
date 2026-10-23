# Papyrus

Papyrus exam prep archive built by students for students.

## Architecture

The project is made in Next.js and thus combines both frontend and backend in a single codebase.

The frontend is built using React components, while the backend handles API requests and data management. The main database uses Bun SQLite, and the schema is defined in `db/schema.sql`.

## Vision/Motivation

As a student that has gone through the board exam phase, I found that one of the most influential factors in my prepartion was the practise of various papers. However, I also found that the availability of these papers was limited and often scattered across various sources. Me and my freinds would scour different websites and resources to find the papers we needed.

This project aims to removee that friction for future students by centralizing and provide easy access to a wide range of exam papers, making it easier for students to prepare effectively.

## Contributing

### 1. Contributing Code

The project is open-source, and contributions are welcome. AI generated slop is not allowed, we dont forbid AI generated code, but we do require that all code is reviewed and approved by a human before being merged with proper human written documentation and explanations.

### 2. Contributing papers/materials

The website has a page to upload papers and materials. All papers are gone through a human review process before being added to the archive. If you have any papers or materials that you would like to contribute, please use the upload page to submit them for review.

Just make sure to:

1. Only submit papers that you have the right to share. Do not submit copyrighted materials without permission.
2. Provide accurate information about the paper, including the subject, year, and any other relevant details.
3. Ensure that the paper is in a readable format (preferably soft copy in PDF format) and is not password-protected or corrupted.
4. Be patient. The review process may take some time, but we will notify you once your submission has been reviewed and approved for inclusion in the archive.

## Features

- A archive page which allows peopple to go through all the papers,
- a pin page to collect all your favorite papers
- a simple settings page
- a upload page to submit papers for review
- admin page to manage the papers and users
