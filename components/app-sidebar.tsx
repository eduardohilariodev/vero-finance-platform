"use client";
import {
  Home,
  Send,
  Landmark,
  Contact2,
  CreditCard,
  BarChart2,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function AppSidebar() {
  const pendingRequests = 23;
  const mainMenu = [
    { title: "Home", url: "/", icon: Home, active: true },
    { title: "Transactions", url: "/transactions", icon: Send },
    {
      title: "Requests",
      url: "/requests",
      icon: Landmark,
      badge: pendingRequests,
    },
    { title: "Contacts", url: "/companies", icon: Contact2 },
    { title: "Cards", url: "#", icon: CreditCard, soon: true },
    { title: "Investments", url: "#", icon: BarChart2, soon: true },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2 px-2 font-bold text-xl text-gray-800 group-data-[collapsible=icon]:hidden">
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center text-white text-xs">
            V
          </div>
          Vero
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    disabled={item.soon}
                    tooltip={item.title}
                  >
                    {item.url && !item.soon ? (
                      <Link
                        href={item.url}
                        className={
                          item.active
                            ? "font-semibold text-black"
                            : "text-gray-600"
                        }
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <button className="text-gray-400 cursor-not-allowed">
                        <item.icon />
                        <span>{item.title}</span>
                        <span className="ml-auto text-[10px] uppercase tracking-wider font-medium text-gray-400">
                          Soon
                        </span>
                      </button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-gray-200 border border-gray-300"></div>
                <div className="flex flex-col text-left text-xs leading-tight">
                  <span className="font-semibold">Infinity Base SA</span>
                  <span className="text-gray-500">acme@company.com</span>
                </div>
              </div>
              <Settings className="ml-auto h-4 w-4 text-gray-500" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
