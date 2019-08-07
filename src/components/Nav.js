import React from 'react'
import NavLink from './NavLink'
import './Nav.css'

export default ({handlePopupOpen}) => (
  <nav className='Nav'>
    <div className='Nav--Container container'>
      <NavLink to='/' exact>
        Sanjay Narayana
      </NavLink>
      <NavLink to='/projects' exact>
        Projects
      </NavLink>
      {/*<NavLink to='/blog' exact>*/}
      {/*  Blog*/}
      {/*</NavLink>*/}
    </div>
  </nav>
)
