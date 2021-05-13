import React, { useCallback, useEffect, useState } from "react"

import usePortal from "react-cool-portal"

export const EMAIL_CONFIRMATION = "email-confirmation"
export const CONFIRMATION_SUCCESS = "confirmation-success"

export const MODAL_DATA = [
  {
    type: EMAIL_CONFIRMATION,
    title: "Success!",
    description: "Now check your email to confirm your subscription",
  },
  {
    type: CONFIRMATION_SUCCESS,
    title: "Done!",
    description: "Thanks for subscribing!",
  },
]

export const useModal = (options = {}) => {
  const { Portal, hide, show, isShow } = usePortal({
    ...options,
    defaultShow: false,
  })

  const [type, setType] = useState(null)
  const [info, setInfo] = useState({})

  useEffect(() => {
    const info = MODAL_DATA.filter(item => item.type === type)
    setInfo(...info)
  }, [type])

  useEffect(() => {
    if (info?.title) {
      show()
    }
  }, [info])

  const Modal = () => (
    <Portal>
      <ModalInfo
        hide={hide}
        title={info?.title}
        description={info?.description}
      />
    </Portal>
  )

  return { Modal, show, hide, setType }
}

const ModalInfo = ({ title, description, hide }) => {
  const handleClickBackdrop = e => {
    const { id } = e.target
    if (id === "modal") hide()
  }
  return (
    <div
      className="modal"
      id="modal"
      tabIndex={-1}
      onClick={handleClickBackdrop}
    >
      <div
        className="modal-container"
        role="dialog"
        aria-labelledby="modal-label"
        aria-modal="true"
      >
        <div className="modal-bar">
          <button className="modal-close" onClick={hide} aria-label="Close">
            <span>&#215;</span>
          </button>
        </div>
        <div className="modal-content-container">
          <h3 className="modal-header">{title}</h3>
          <p className="modal-content">{description}</p>

          <button className="modal-button" onClick={hide}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
