import { useState, useEffect } from 'react';
import { getLevel1, getLevel2 } from '../services/categories';

export const useCategories = (initialLevel1 = '') => {
  const [level1List, setLevel1List] = useState([]);
  const [level2List, setLevel2List] = useState([]);
  const [level1, setLevel1] = useState(initialLevel1);
  const [level2, setLevel2] = useState('');

  useEffect(() => {
    getLevel1()
      .then(res => setLevel1List(res.data || []))
      .catch(err => console.error('Level1 error:', err));
  }, []);

  useEffect(() => {
    if (level1) {
      getLevel2(level1)
        .then(res => setLevel2List(res.data || []))
        .catch(err => console.error('Level2 error:', err));
    } else {
      setLevel2List([]);
    }
  }, [level1]);

  return {
    level1List,
    level2List,
    level1,
    level2,
    setLevel1,
    setLevel2,
  };
};