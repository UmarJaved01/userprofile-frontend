import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', gender: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0); // Track consecutive errors
  const navigate = useNavigate();

  useEffect(() => {
    const validateSessionAndFetchProfile = async () => {
      let attempt = 0;
      const maxAttempts = 3;
      const maxErrors = 2; // Reduced to 2 for faster failover

      while (attempt < maxAttempts && errorCount < maxErrors) {
        try {
          console.log(`Validating session on HTTPS, attempt ${attempt + 1} of ${maxAttempts}`);
          const res = await axiosInstance.get('/profile');
          console.log('Session validated, profile fetched:', res.data);
          setProfile(res.data);
          setFormData({
            name: res.data.name || '',
            age: res.data.age || '',
            gender: res.data.gender || '',
          });
          setErrorCount(0); // Reset error count on success
          break;
        } catch (err) {
          console.error('Session validation failed, attempt', attempt + 1, ':', err.message);
          setErrorCount(prev => prev + 1);
          if (attempt === maxAttempts - 1 || errorCount >= maxErrors - 1) {
            handleLogoutOnFailure(err);
            break; // Exit loop on max errors
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        }
      }

      if (errorCount >= maxErrors) {
        handleLogoutOnFailure(new Error('Max session validation errors reached'));
      }
      setIsLoading(false);
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
      console.log('Attempting to add profile on HTTPS');
      const res = await axiosInstance.post('/profile', formData);
      setProfile(res.data);
      setErrorCount(0); // Reset on success
    } catch (err) {
      console.error('Error adding profile:', err.message);
      setErrorCount(prev => prev + 1);
      if (errorCount >= 1) { // Reduced to 2 total errors
        handleLogoutOnFailure(err);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      console.log('Attempting to update profile on HTTPS');
      const res = await axiosInstance.put('/profile', formData);
      setProfile(res.data);
      setErrorCount(0); // Reset on success
    } catch (err) {
      console.error('Error updating profile:', err.message);
      setErrorCount(prev => prev + 1);
      if (errorCount >= 1) { // Reduced to 2 total errors
        handleLogoutOnFailure(err);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile?')) return;
    if (isLoading) return;
    try {
      console.log('Attempting to delete profile on HTTPS');
      await axiosInstance.delete('/profile');
      setProfile(null);
      setFormData({ name: '', age: '', gender: '' });
      setErrorCount(0); // Reset on success
    } catch (err) {
      console.error('Error deleting profile:', err.message);
      setErrorCount(prev => prev + 1);
      if (errorCount >= 1) { // Reduced to 2 total errors
        handleLogoutOnFailure(err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Attempting manual logout on HTTPS');
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error('Error logging out:', err.message);
    } finally {
      localStorage.removeItem('token');
      setProfile(null);
      setErrorCount(0);
      navigate('/');
    }
  };

  const handleLogoutOnFailure = (err) => {
    console.log('Forcing logout due to error on HTTPS:', err.message);
    localStorage.removeItem('token');
    setProfile(null);
    setIsLoading(false);
    setErrorCount(0);
    navigate('/'); // Force redirect to login page
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