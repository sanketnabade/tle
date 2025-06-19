import { Box, Typography } from '@mui/material';

const getRatingColor = (rating) => {
  if (rating === null || rating === undefined) return '#000000';
  if (rating < 1200) return '#808080';  // gray
  if (rating < 1400) return '#008000';  // green
  if (rating < 1600) return '#03a89e';  // cyan
  if (rating < 1900) return '#0000ff';  // blue
  if (rating < 2100) return '#aa00aa';  // violet
  if (rating < 2400) return '#ff8c00';  // orange
  return '#ff0000';  // red for ratings >= 2400
};

const getRatingLabel = (rating) => {
  if (rating === null || rating === undefined) return 'Unrated';
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Specialist';
  if (rating < 1900) return 'Expert';
  if (rating < 2100) return 'Candidate Master';
  if (rating < 2400) return 'Master';
  if (rating < 2600) return 'International Master';
  if (rating < 3000) return 'Grandmaster';
  return 'Legendary Grandmaster';
};

function CodeforcesRating({ rating }) {
  const color = getRatingColor(rating);
  const label = getRatingLabel(rating);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography
        sx={{
          color: color,
          fontWeight: 'bold',
        }}
      >
        {rating || 'Unrated'}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: color,
          opacity: 0.8,
        }}
      >
        ({label})
      </Typography>
    </Box>
  );
}

export default CodeforcesRating;
