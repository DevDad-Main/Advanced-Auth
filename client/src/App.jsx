import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router-dom";

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-50 to-white">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Outlet />
    </div>
  );
};

export default App;