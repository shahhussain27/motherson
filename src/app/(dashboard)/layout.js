import { NavigationBar } from "@/components/dashboard/NavigationBar";
import MarqueeText from "react-marquee-text";
import React from "react";
import AuthWrapper from "@/components/AuthWrapper";

const layout = ({ children }) => {
  return (
    <>
      <NavigationBar />
      <MarqueeText
        className="text-[#2563eb] font-semibold bg-[#f0f2f7]"
        textSpacing={200}
        speed={50}
      >
        Advance Manpower Review And Management Dashboard
      </MarqueeText>
      <main className="p-4">
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </main>
    </>
  );
};

export default layout;
