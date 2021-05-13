import * as React from "react"
import { Link, navigate } from "gatsby"
import qs from "qs"
import { CONFIRMATION_SUCCESS, EMAIL_CONFIRMATION, useModal } from "./modal"

const QUERIES = [EMAIL_CONFIRMATION, CONFIRMATION_SUCCESS]

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    )
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    )
  }

  const { source } = qs.parse(location.search, { ignoreQueryPrefix: true })
  const { Modal, setType } = useModal()

  React.useEffect(() => {
    if (QUERIES.some(query => query === source)) {
      setType(source)
      navigate("/")
    }
  }, [source, setType])

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
        © {new Date().getFullYear()}, Built with
        {` `}
        <a href="https://www.gatsbyjs.com">Gatsby</a>
      </footer>
      <Modal />
    </div>
  )
}

export default Layout
