# SciBit AI Wordle

A modern, AI-powered Wordle-like game focused on AI and machine learning terminology. Players guess AI-related terms while learning about important concepts in the field.

## 🎮 Features

- **Daily AI Word Challenges**: New AI/ML terminology to guess each day
- **Multiple Difficulty Levels**: Easy, Medium, and Hard modes
- **Smart Clues**: AI-generated hints that help without giving away the answer
- **Educational Content**: Learn about AI concepts through detailed summaries
- **Performance Optimized**: Efficient word generation and caching system
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Feedback**: Instant feedback on guesses with color-coded tiles

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with server-side rendering
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI components
- **React Query**: Data fetching and caching
- **Lucide React**: Beautiful icons

### Backend
- **Firebase**: Database and authentication
- **Google Cloud**: Secret management and hosting
- **GenKit AI**: AI-powered content generation
- **Zod**: Schema validation

### Development Tools
- **Jest**: Testing framework
- **Turbopack**: Fast development server
- **ESLint**: Code linting
- **TypeScript**: Static type checking

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd scibit_ai_wordle_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path-to-credentials.json
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Start the AI service**
   ```bash
   npm run genkit:dev
   ```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📝 Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type checking
- `npm run test`: Run Jest tests
- `npm run genkit:dev`: Start AI service
- `npm run genkit:watch`: Start AI service in watch mode

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the original Wordle game
- Built with modern web technologies
- Powered by AI for educational purposes
