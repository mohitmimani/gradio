<a href="https://gradio-ai-review.com/">
<img src="/public/opengraph-image.jpg" alt="Gradio AI Assignment Reviewer">
</a>
<p align="center">
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-deployment"><strong>Deployment</strong></a> ·
  <a href="#-getting-started"><strong>Getting started</strong></a> ·
  <a href="#-scripts-overview"><strong>Scripts overview</strong></a> ·
  <a href="#-contribution"><strong>Contribution</strong></a> ·
  <a href="#-support"><strong>Support</strong></a>
</p>

## 🎉 Features

Gradio is an AI-powered assignment reviewer platform for teachers and students.

- ✨ **AI-Powered Assignment Creation**: Instantly generate assignments for any subject and difficulty level.
- 🚀 **Seamless Student Access**: Share assignments via secure links or QR codes; students can submit work without sign-up.
- 🤖 **Instant AI Feedback**: Automated, detailed analysis of student submissions including scores, strengths, and suggestions.
- 📊 **Teacher Dashboard**: Track assignment progress, review submissions, and manage classes efficiently.
- 🧑‍🎓 **Personalized Student Insights**: Students receive actionable feedback and improvement suggestions tailored to their answers.
- 📝 **Model Answers & Learning**: Compare student submissions with AI-generated model answers to enhance learning outcomes.
- 💵 **Stripe Integration**: Upgrade to PRO for advanced features.
- 🔒 **Authentication**: Secure login with Next-auth.
- 🎨 **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui.
- 🌑 **Dark mode**: Beautiful experience in both light and dark themes.

## 🚀 Deployment

Deploy your Gradio app with <a href="https://vercel.com/">Vercel</a>:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Skolaczk/next-starter)

## 🎯 Getting started

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/gradio-ai-review.git
   cd gradio-ai-review
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` and fill in your credentials.

4. **Prepare Husky (optional)**

   ```bash
   npm run prepare
   ```

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project structure

```bash
.
├── public                          # Public assets
└── src
    ├── __tests__                   # Unit and e2e tests
    ├── actions                     # Server actions
    ├── app                         # Next.js App Router
    ├── components                  # React components
    ├── lib                         # Functions and utilities
    ├── styles                      # Styles folder
    └── env.mjs                     # Env variables config file
```

## ⚙️ Scripts overview

- `dev`: Run development server
- `build`: Build the app
- `start`: Run production server
- `preview`: Build and start together
- `lint`: Lint the code
- `lint:fix`: Fix lint errors
- `format:check`: Check code formatting
- `format:write`: Fix formatting
- `typecheck`: Type-check TypeScript
- `test`: Run unit tests
- `test:watch`: Watch mode for tests
- `e2e`: Run end-to-end tests
- `e2e:ui`: E2E tests with UI
- `postbuild`: Generate sitemap
- `prepare`: Install Husky for Git hooks

## 🤝 Contribution

1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit.
4. Push to your fork.
5. Create a pull request.

## ❤️ Support

If you like Gradio, please star the project! 🌟

Made by <a href="https://mohitmimani.com/">Mohit Mimani</a>
