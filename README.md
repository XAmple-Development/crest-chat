# LovableChat - Discord-Style Chat Application

A modern, real-time chat application built with React, TypeScript, Supabase, and Tailwind CSS. Features a beautiful Discord-inspired interface with server management, real-time messaging, and user authentication.

## 🚀 Features

- **Real-time Messaging**: Instant messaging with Supabase real-time subscriptions
- **Server Management**: Create and join servers with custom channels
- **User Authentication**: Secure authentication with Supabase Auth
- **Server Invites**: Generate and share invite codes to join servers
- **Mobile Responsive**: Beautiful interface that works on all devices
- **Discord-like UI**: Familiar interface with modern design
- **Role-based Permissions**: Server roles (owner, admin, moderator, member)
- **Online Users**: See who's online in your servers
- **Channel Types**: Text and voice channels (voice UI ready for WebRTC integration)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Deployment**: Netlify

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crest-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the database migrations in `supabase/migrations/`
   - Copy your Supabase URL and anon key

4. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment to Netlify

### Option 1: Deploy via Netlify UI

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Click "Deploy site"

3. **Configure environment variables**
   - Go to Site settings > Environment variables
   - Add your Supabase URL and anon key:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Configure environment variables**
   ```bash
   netlify env:set VITE_SUPABASE_URL your_supabase_url
   netlify env:set VITE_SUPABASE_ANON_KEY your_supabase_anon_key
   ```

## 🗄️ Database Setup

The application uses Supabase with the following main tables:

- **profiles**: User profiles and information
- **servers**: Server information and settings
- **channels**: Text and voice channels within servers
- **server_members**: Server membership and roles
- **messages**: Chat messages with real-time updates
- **friendships**: Friend relationships between users
- **direct_messages**: Private messages between users

Run the migrations in `supabase/migrations/` to set up the database schema.

## 🎨 Customization

### Styling
The application uses Tailwind CSS with a custom Discord-inspired design system. You can customize colors and styles in:
- `src/index.css` - Main CSS variables and utilities
- `tailwind.config.ts` - Tailwind configuration

### Components
All UI components are built with Shadcn/ui and can be customized in the `src/components/ui/` directory.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── AppLayout.tsx   # Main layout component
│   ├── ChatArea.tsx    # Chat interface
│   ├── ServerSidebar.tsx # Server navigation
│   └── OnlineUsers.tsx # Online users list
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── integrations/       # External integrations
│   └── supabase/       # Supabase client and types
└── lib/                # Utility functions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [React documentation](https://react.dev)
3. Open an issue in this repository

## 🎯 Roadmap

- [ ] Voice channels with WebRTC
- [ ] File uploads and attachments
- [ ] Message reactions and emojis
- [ ] Threaded conversations
- [ ] Server categories and organization
- [ ] Advanced moderation tools
- [ ] Push notifications
- [ ] Dark/light theme toggle
- [ ] User status and activity
- [ ] Server analytics and insights

---

Built with ❤️ using modern web technologies
