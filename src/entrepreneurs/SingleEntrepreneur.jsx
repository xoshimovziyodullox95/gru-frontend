const SingleEntrepreneurCard = ({ entrepreneur }) => {
  if (!entrepreneur) return null;
  return (
    <div className="single-entrepreneur-card">
      <div className="entrepreneur-image-square">
        <img src={entrepreneur.image} alt={entrepreneur.name} onError={(e) => e.target.src = '/images/placeholder.jpg'} />
      </div>
      <div className="entrepreneur-details">
        <h3 className="entrepreneur-name">{entrepreneur.name}</h3>
        <p className="entrepreneur-title">{entrepreneur.title}</p>
        <p className="entrepreneur-founded">🏢 Asos solingan: {entrepreneur.founded}</p>
        <p className="entrepreneur-achievement">🏆 Yutuq: {entrepreneur.achievement}</p>
        <div className="entrepreneur-quote">
          <Quote size={20} className="quote-icon" />
          <p className="slogan">“{entrepreneur.slogan}”</p>
        </div>
      </div>
    </div>
  );
};