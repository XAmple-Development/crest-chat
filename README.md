# CrestChat - Discord-like Chat Application

A modern, real-time chat application built with React, TypeScript, and Supabase, designed to replicate Discord's core functionality.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery with Supabase real-time subscriptions
- **User Authentication**: Secure sign-up and sign-in with Supabase Auth
- **Server Management**: Create and manage Discord-style servers
- **Channel System**: Text channels with real-time messaging
- **User Profiles**: Customizable user profiles with avatars and status
- **Responsive Design**: Mobile-friendly interface with Discord-inspired UI
- **Modern Tech Stack**: Built with React 18, TypeScript, Tailwind CSS, and shadcn/ui

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Deployment**: Netlify ready

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crest-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `complete-database-setup.sql`
   - Run the script to create all tables, functions, and policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The application uses a comprehensive Discord-like database schema with the following tables:

- **profiles**: User profiles with Discord-like fields
- **servers**: Discord servers with all features
- **channels**: Text, voice, and other channel types
- **messages**: Chat messages with reactions and embeds
- **server_members**: Server membership and roles
- **user_settings**: User preferences and settings
- **invites**: Server invitation system
- **voice_states**: Voice chat states
- **audit_logs**: Server audit logs

## 🎨 UI Components

The application uses shadcn/ui components for a consistent, modern design:

- **Button**: Various button styles and sizes
- **Input**: Form inputs with validation
- **Card**: Content containers
- **Tabs**: Tabbed interfaces
- **Tooltip**: Hover tooltips
- **And more...**

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── lib/                # Utility functions
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── assets/             # Static assets
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🚀 Deployment

### Netlify Deployment

1. **Connect your repository** to Netlify
2. **Set build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variables** in Netlify dashboard
4. **Deploy!**

### Environment Variables for Production
Make sure to set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🔒 Security

- **Row Level Security (RLS)**: All database tables have proper RLS policies
- **Authentication**: Secure user authentication with Supabase Auth
- **Input Validation**: Client and server-side validation
- **CORS**: Proper CORS configuration for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error messages

## 🎯 Roadmap

- [ ] Voice and video chat
- [ ] File uploads and sharing
- [ ] Server roles and permissions
- [ ] Direct messaging
- [ ] Message reactions and emojis
- [ ] Server discovery
- [ ] Mobile app
- [ ] Bot API
- [ ] Webhook support

---

Built with ❤️ using modern web technologies
