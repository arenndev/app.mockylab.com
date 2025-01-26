"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import DarkModeSwitcher from "./DarkModeSwitcher";

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Current User:', currentUser);
    setUser(currentUser);
  }, []);

  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const handleLogout = async () => {
    try {
      authService.logout();
      // Ensure we're completely redirected to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
      window.location.href = '/login';
    }
  };

  return (
    <div className="relative">
      <Link
        ref={trigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        href="#"
      >
        <span className="hidden text-right lg:block">
          <span className="block text-sm font-medium text-black dark:text-white">
            {user?.username || "User"}
          </span>
          <span className="block text-xs">{user?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "User"}</span>
        </span>

        <span className="h-12 w-12 rounded-full">
          <Image
            width={112}
            height={112}
            src={"/images/user/user-01.png"}
            alt="User"
          />
        </span>

        <svg
          className="hidden fill-current sm:block"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
            fill=""
          />
        </svg>
      </Link>

      {/* <!-- Dropdown Start --> */}
      <div
        ref={dropdown}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        className={`absolute right-0 mt-4 flex w-62.5 flex-col rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${
          dropdownOpen === true ? "block" : "hidden"
        }`}
      >
        <div className="flex flex-col gap-5 px-6 py-4 dark:border-strokedark">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-4">
              <span className="h-12 w-12 rounded-full">
                <Image
                  width={112}
                  height={112}
                  src={"/images/user/user-01.png"}
                  alt="User"
                  className="rounded-full"
                />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-black dark:text-white">
                  {user?.username || "User"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col border-t border-stroke px-6 py-4 dark:border-strokedark">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-black dark:text-white">
              Dark Mode
            </span>
            <DarkModeSwitcher />
          </div>
        </div>

        <div className="border-t border-stroke dark:border-strokedark">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:bg-gray-100 dark:hover:bg-meta-4"
          >
            <svg
              className="fill-current"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.5375 0.618744H11.6531C10.7594 0.618744 10.0031 1.37499 10.0031 2.26874V4.64062C10.0031 5.05312 10.3469 5.39687 10.7594 5.39687C11.1719 5.39687 11.5156 5.05312 11.5156 4.64062V2.23437C11.5156 2.16562 11.5844 2.09687 11.6531 2.09687H15.5375C16.3625 2.09687 17.0156 2.71562 17.0156 3.50624V18.4937C17.0156 19.3187 16.3625 19.9031 15.5375 19.9031H11.6531C11.5844 19.9031 11.5156 19.8344 11.5156 19.7656V17.3594C11.5156 16.9469 11.1719 16.6031 10.7594 16.6031C10.3469 16.6031 10.0031 16.9469 10.0031 17.3594V19.7656C10.0031 20.6594 10.7594 21.4156 11.6531 21.4156H15.5375C17.2219 21.4156 18.5281 20.1094 18.5281 18.4937V3.50624C18.5281 1.82499 17.2219 0.618744 15.5375 0.618744Z"
                fill=""
              />
              <path
                d="M6.05001 11.7563H12.2031C12.6156 11.7563 12.9594 11.4125 12.9594 11C12.9594 10.5875 12.6156 10.2438 12.2031 10.2438H6.08439L8.21564 8.07813C8.52501 7.76875 8.52501 7.2875 8.21564 6.97812C7.90626 6.66875 7.42501 6.66875 7.11564 6.97812L3.67814 10.4844C3.36876 10.7938 3.36876 11.275 3.67814 11.5844L7.11564 15.0906C7.25314 15.2281 7.45939 15.3312 7.66564 15.3312C7.87189 15.3312 8.04376 15.2625 8.21564 15.125C8.52501 14.8156 8.52501 14.3344 8.21564 14.025L6.05001 11.7563Z"
                fill=""
              />
            </svg>
            Log Out
          </button>
        </div>
      </div>
      {/* <!-- Dropdown End --> */}
    </div>
  );
};

export default DropdownUser;
