import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
