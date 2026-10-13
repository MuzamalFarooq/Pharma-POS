export function getDateRangeFilter(range) {
  const now = new Date();
  if (!range || range === 'all') {
    return null;
  }

  const startDate = new Date();
  if (range === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else if (range === '90d') {
    startDate.setDate(now.getDate() - 90);
  } else if (range === 'year') {
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    // default to 30 days
    startDate.setDate(now.getDate() - 30);
  }

  return { gte: startDate };
}

export function getPastDate(days = 14) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function buildTimeSeriesSlots(days = 14) {
  const slots = new Map();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    slots.set(dateStr, { date: displayLabel, sales: 0, pharmacies: 0, orders: 0 });
  }
  return slots;
}
