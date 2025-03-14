// src/components/Profile.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', gender: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProfile(res.data);
        setFormData({
          name: res.data.name || '',
          age: res.data.age || '',
          gender: res.data.gender || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err.response?.data || err.message);
        if (err.response && err.response.status === 404) {
          setProfile(null);
        } else {
          setProfile(null);
          setFormData({ name: '', age: '', gender: '' });
          navigate('/');
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/profile', formData);
      setProfile(res.data);
    } catch (err) {
      console.error('Error adding profile:', err.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        navigate('/');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.put('/profile', formData);
      setProfile(res.data);
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        navigate('/');
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile?')) return;
    try {
      await axiosInstance.delete('/profile');
      setProfile(null);
      setFormData({ name: '', age: '', gender: '' });
    } catch (err) {
      console.error('Error deleting profile:', err.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        navigate('/');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      localStorage.removeItem('token');
      setProfile(null);
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err.response?.data || err.message);
      localStorage.removeItem('token');
      setProfile(null);
      navigate('/');
    }
  };

  return (
    <div className="profile-container">
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
      <h2>User Profile</h2>
      <div className="profile-layout">
        <div className="profile-form">
          <form onSubmit={profile ? handleUpdate : handleAdd}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
            />
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
            />
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {!profile && <button type="submit">Add Profile</button>}
            {profile && <button type="submit">Update Profile</button>}
          </form>
        </div>
        <div className="profile-card">
          {profile ? (
            <>
              <p>Name: {profile.name || 'Not set'}</p>
              <p>Age: {profile.age || 'Not set'}</p>
              <p>Gender: {profile.gender || 'Not set'}</p>
              <button className="delete-btn" onClick={handleDelete}>
                Delete Profile
              </button>
            </>
          ) : (
            <p>No profile exists yet. Add one!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;