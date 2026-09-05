type SideStripProps = {
  dockOffset?: boolean
}

export default function SideStrip({ dockOffset = false }: SideStripProps) {
  return (
    <div className="side-strip" aria-hidden="true">
      <span className={dockOffset ? 'wordmark wordmark--dock' : 'wordmark'}>
        new mainstream
      </span>
    </div>
  )
}
