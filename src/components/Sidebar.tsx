
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  User,
  Users,
  Building2,
  Settings,
  UserRound,
  LogOut,
  ChevronRight,
  Menu,
  MessagesSquare
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  subLinks?: { to: string; text: string }[];
  onClick?: () => void;
}

const SidebarLink = ({
  to,
  icon,
  text,
  active = false,
  subLinks,
  onClick,
}: SidebarLinkProps) => {
  const [subMenuOpen, setSubMenuOpen] = React.useState(false);
  const hasSubLinks = subLinks && subLinks.length > 0;

  return (
    <div>
      <Link to={to} onClick={onClick}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 mb-1",
            active && "bg-accent text-accent-foreground"
          )}
        >
          {icon}
          <span className="flex-1 text-left">{text}</span>
          {hasSubLinks && (
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                subMenuOpen && "rotate-90"
              )}
              onClick={(e) => {
                e.preventDefault();
                setSubMenuOpen(!subMenuOpen);
              }}
            />
          )}
        </Button>
      </Link>
      {hasSubLinks && subMenuOpen && (
        <div className="ml-6 border-l pl-2 my-2">
          {subLinks.map((link) => (
            <Link to={link.to} key={link.to}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-1 text-sm",
                  active && link.to === window.location.pathname && "bg-accent"
                )}
              >
                {link.text}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const adminLinks = [
    {
      to: "/app/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      text: "Administration",
    },
    {
      to: "/app/admin/patients",
      icon: <Users className="h-5 w-5" />,
      text: "Patients",
    },
    {
      to: "/app/admin/practitioners",
      icon: <UserRound className="h-5 w-5" />,
      text: "Praticiens",
    },
    {
      to: "/app/admin/centers",
      icon: <Building2 className="h-5 w-5" />,
      text: "Centres de santé",
    },
    {
      to: "/app/admin/practitioner-centers",
      icon: <Building2 className="h-5 w-5" />,
      text: "Praticiens - Centres",
    },
    {
      to: "/app/admin/appointments",
      icon: <Calendar className="h-5 w-5" />,
      text: "Rendez-vous",
    },
    {
      to: "/app/admin/messaging",
      icon: <MessagesSquare className="h-5 w-5" />,
      text: "Messagerie",
    },
    {
      to: "/app/admin/settings",
      icon: <Settings className="h-5 w-5" />,
      text: "Paramètres",
    },
  ];

  const userLinks = [
    {
      to: "/app",
      icon: <LayoutDashboard className="h-5 w-5" />,
      text: "Tableau de bord",
    },
    {
      to: "/app/appointments",
      icon: <Calendar className="h-5 w-5" />,
      text: "Rendez-vous",
    },
    {
      to: "/app/doctors",
      icon: <Users className="h-5 w-5" />,
      text: "Médecins",
    },
    {
      to: "/app/messaging",
      icon: <MessagesSquare className="h-5 w-5" />,
      text: "Messagerie",
    },
    {
      to: "/app/profile",
      icon: <User className="h-5 w-5" />,
      text: "Mon profil",
    },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div
      className={cn(
        "h-full border-r bg-background transition-all duration-300 ease-in-out md:relative fixed top-0 left-0 z-40 md:z-0",
        open ? "w-64" : "w-0 md:w-16 overflow-hidden"
      )}
    >
      <div className="h-16 border-b flex items-center justify-between px-4">
        <h1
          className={cn(
            "font-bold text-xl transition-opacity",
            open ? "opacity-100" : "opacity-0 md:opacity-0"
          )}
        >
          MediSync
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(false)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-col justify-between h-[calc(100%-4rem)] py-4 overflow-y-auto">
        <nav className="px-2">
          {links.map((link) => (
            <SidebarLink
              key={link.to}
              to={link.to}
              icon={link.icon}
              text={link.text}
              active={pathname === link.to}
            />
          ))}
        </nav>
        <div className="mt-auto px-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            disabled={loading}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className={cn("transition-opacity", open ? "opacity-100" : "opacity-0 md:opacity-0")}>
              Déconnexion
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
