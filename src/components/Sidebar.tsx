
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  LogOut,
  Menu,
  X,
  Shield,
  Settings,
  UserCog,
  Building,
  Link2,
  Users,
  Calendar,
  CalendarRange
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// Define a proper interface for sidebar items
interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
  exact?: boolean; // Making 'exact' an optional property
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { signOut, isAdmin } = useAuth();

  // Track window size
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [location.pathname, isMobile, setOpen]);

  const commonSidebarItems: SidebarItem[] = [
    { name: "Tableau de bord", path: "/app", icon: Home, exact: true },
    { name: "Rendez-vous", path: "/app/appointments", icon: Calendar },
    { name: "Médecins", path: "/app/doctors", icon: Users },
    { name: "Mon profil", path: "/app/profile", icon: Users }
  ];

  const adminSidebarItems: SidebarItem[] = [
    { name: "Dashboard Admin", path: "/app/admin/dashboard", icon: Shield },
    { name: "Patients", path: "/app/admin/patients", icon: Users },
    { name: "Praticiens", path: "/app/admin/practitioners", icon: UserCog },
    { name: "Centres de santé", path: "/app/admin/centers", icon: Building },
    { name: "Affiliations", path: "/app/admin/practitioner-centers", icon: Link2 },
    { name: "Rendez-vous", path: "/app/admin/appointments", icon: CalendarRange },
    { name: "Paramètres", path: "/app/admin/settings", icon: Settings }
  ];

  // Pour les administrateurs, n'afficher que les sections d'administration
  const sidebarItems: SidebarItem[] = isAdmin
    ? adminSidebarItems
    : commonSidebarItems;

  const isPathActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:sticky top-0 left-0 z-30 lg:z-0 h-screen bg-background border-r",
          "w-[280px] transition-transform duration-300 ease-in-out",
          isMobile && !open && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link to="/app" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4C5.79 4 4 5.79 4 8C4 10.21 5.79 12 8 12C10.21 12 12 10.21 12 8C12 5.79 10.21 4 8 4ZM8.5 10H7.5V8.5H6V7.5H7.5V6H8.5V7.5H10V8.5H8.5V10Z" fill="white"/>
                </svg>
              </div>
              <span className="text-xl font-semibold">AlafiaSync</span>
            </Link>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X size={18} />
              </Button>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                  "hover:bg-secondary",
                  isPathActive(item.path, item.exact) 
                    ? "bg-secondary text-primary font-medium" 
                    : "text-foreground/70"
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-foreground/70 hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut size={18} className="mr-3" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
