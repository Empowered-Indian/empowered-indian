import { AuthProvider } from '../contexts/AuthContext'
import Login from './MPLADS/pages/Login'

const LoginRoute = () => (
  <AuthProvider>
    <Login />
  </AuthProvider>
)

export default LoginRoute
