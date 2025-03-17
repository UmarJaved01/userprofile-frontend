import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', gender: '' });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const validateSessionAndFetchProfile = async () => {
      try {
        console.log('Validating session on Profile page load');
        const res = await axiosInstance.get('/profile');
        console.log('Session validated, profile fetched:', res.data);
        setProfile(res.data);
        setFormData({
          name: res.data.name || '',
          age: res.data.age || '',
          gender: res.data.gender || '',
        });
      } catch (err) {
        console.error('Session validation failed:', err.message);
        // Logout is handled by axios interceptor, no need to duplicate here
        setProfile(null); // Ensure profile state is cleared
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    validateSessionAndFetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      console.log('Attempting to add profile');
      const res = await axiosInstance.post('/profile', formData);
      setProfile(res.data);
    } catch (err) {
      console.error('Error adding profile:', err.message);
      setProfile(null); // Clear profile on error
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      console.log('Attempting to update profile');
      const res = await axiosInstance.put('/profile', formData);
      setProfile(res.data);
    } catch (err) {
      console.error('Error updating profile:', err.message);
      setProfile(null); // Clear profile on error
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile?')) return;
    if (isLoading) return;
    try {
      console.log('Attempting to delete profile');
      await axiosInstance.delete('/profile');
      setProfile(null);
      setFormData({ name: '', age: '', gender: '' });
    } catch (err) {
      console.error('Error deleting profile:', err.message);
      setProfile(null); // Clear profile on error
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Attempting manual logout');
      await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Error logging out:', err.message);
    } finally {
      localStorage.removeItem('token');
      setProfile(null);
      navigate('/', { replace: true }); // Replace history to prevent back navigation
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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