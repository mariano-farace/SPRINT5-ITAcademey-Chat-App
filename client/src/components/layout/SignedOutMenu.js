import React from "react"
import { Link } from "react-router-dom"

function SignedOutMenu() {
  return (
    <div>
      <li>
        <Link to="/login">
          <div>Login</div>
        </Link>
      </li>
      <li>
        <Link to="/signup">
          <div>Signup</div>
        </Link>
      </li>
    </div>
  )
}

export default SignedOutMenu
