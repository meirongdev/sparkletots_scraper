## Why this tools

This is simple tools for scraping data form the [sparklet](https://pcfsparkletots.qoqolo.com/).

Build a doc lib for my child's care center life.

## Installation

```bash
brew install pnpm

pnpm install
```

## Usage 

Create your `.env` file.
```bash
cp .env.example .env
```

Fill the infomation in `.env`.

```ini
url=https://pcfsparkletots.qoqolo.com/
username=your username
password=your password
start_month=202401
end_month=202408
save_dir=./checkin_images
```

Start to run
```bash
pnpm start
```

## Functionality

- [x] sign-in/out photos
- [ ] photo/video in activities
- [ ] save some page to pdf