import BillExtractor from './components/BillExtractor';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 selection:bg-blue-100">
      {/* Abstract Background Design */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-30 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-30 translate-y-1/3 -translate-x-1/4" />
      </div>

      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">B</div>
            <span className="font-bold text-gray-900 tracking-tight">BillParser AI</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">How it works</a>
            <button className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-12 pb-24">
        <BillExtractor />
      </div>

      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-gray-400 text-sm">Powered by Gemini 3 Flash & Google Cloud</p>
          <div className="flex justify-center gap-6 text-gray-300 text-xs uppercase tracking-widest font-bold">
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Security</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

