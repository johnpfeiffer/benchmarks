import { RouterProvider, createBrowserRouter, Outlet, useParams } from 'react-router-dom'

export type AppContext = { app: string }

function HomePage() {
  return (
    <div className="App">
      <header className="App-header">
        <p>Example React template</p>
      </header>
    </div>
  )
}

function AppLayout() {
  const { app = '' } = useParams()
  return <Outlet context={{ app } satisfies AppContext} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        path: ':app',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
        ],
      },
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
