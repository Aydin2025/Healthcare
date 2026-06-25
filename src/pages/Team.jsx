const team = [
  {
    initials: 'AR',
    name: 'A. Reyes, PT',
    role: 'Sports Rehabilitation',
    bio: 'Works with athletes returning from injury, focused on getting back to full training load safely.',
  },
  {
    initials: 'MC',
    name: 'M. Chen, PT',
    role: 'Post-Surgical Recovery',
    bio: 'Coordinates closely with surgeons to build staged recovery plans after major procedures.',
  },
  {
    initials: 'SO',
    name: 'S. Okafor, PT',
    role: 'Chronic Pain & Mobility',
    bio: 'Specializes in long-term mobility issues and pain that hasn\u2019t responded to past treatment.',
  },
]

export default function Team() {
  return (
    <div className="container">
      <div className="page-header">
        <p className="eyebrow">Meet the team</p>
        <h1>Our Team</h1>
        <p>Placeholder bios below — replace with your real practitioners,
        their credentials, and real photos before launch.</p>
      </div>

      <div className="team-grid">
        {team.map((person) => (
          <div className="team-card" key={person.name}>
            <div className="team-card__avatar">{person.initials}</div>
            <h3>{person.name}</h3>
            <div className="team-card__role">{person.role}</div>
            <p className="bio">{person.bio}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
