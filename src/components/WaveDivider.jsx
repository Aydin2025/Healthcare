// Signature visual motif: a flowing line representing restored
// range of motion. Used between sections instead of generic dividers.
export default function WaveDivider({ flip = false }) {
  return (
    <div className={`wave-divider ${flip ? 'wave-divider--flip' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path
          className="wave-divider__path"
          d="M0,30 C150,60 300,0 450,30 C600,60 750,0 900,30 C1050,60 1150,30 1200,30"
        />
      </svg>
    </div>
  )
}
