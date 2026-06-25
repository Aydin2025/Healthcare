const services = [
  {
    name: 'Initial Assessment',
    duration: '45 min',
    description: 'A full movement and pain history so we can build a plan specific to you.',
  },
  {
    name: 'Manual Therapy',
    duration: '30 min',
    description: 'Hands-on techniques to ease pain and restore range of motion.',
  },
  {
    name: 'Exercise Rehabilitation',
    duration: '45 min',
    description: 'Guided strength and mobility work targeted to your injury.',
  },
  {
    name: 'Post-Surgical Rehab',
    duration: '45 min',
    description: 'Structured recovery plans coordinated with your surgeon.',
  },
  {
    name: 'Sports Injury Care',
    duration: '30 min',
    description: 'Get back to your sport with a plan built around its specific demands.',
  },
  {
    name: 'Follow-Up Visit',
    duration: '20 min',
    description: 'Check progress, adjust your plan, and keep moving forward.',
  },
]

export default function Services() {
  return (
    <div className="container">
      <div className="page-header">
        <p className="eyebrow">What we offer</p>
        <h1>Services</h1>
        <p>Every visit starts with how you move. Pick a service below, or book an
        initial assessment if you're not sure what you need yet.</p>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <div className="service-card" key={service.name}>
            <div className="service-card__top">
              <h3>{service.name}</h3>
              <span className="service-card__duration">{service.duration}</span>
            </div>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
