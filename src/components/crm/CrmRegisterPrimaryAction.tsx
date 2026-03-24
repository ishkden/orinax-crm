"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCrmHeaderAction } from "./CrmHeaderActionContext";

interface Props {
  label: string;
  href?: string;
  onClick?: () => void;
}

/** Registers a primary button in CRM header until unmount */
export default function CrmRegisterPrimaryAction({ label, href, onClick }: Props) {
  const { setHeaderAction } = useCrmHeaderAction();
  const router = useRouter();

  useEffect(() => {
    setHeaderAction({
      label,
      onClick: () => {
        if (onClick) onClick();
        else if (href) router.push(href);
      },
    });
    return () => setHeaderAction(null);
  }, [label, href, onClick, router, setHeaderAction]);

  return null;
}
