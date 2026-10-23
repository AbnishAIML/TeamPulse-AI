import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("teampulse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queue for pending requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor with auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints (login, register, refresh)
    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      const refreshToken = localStorage.getItem("teampulse_refresh_token");

      if (!refreshToken) {
        localStorage.removeItem("teampulse_token");
        localStorage.removeItem("teampulse_refresh_token");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("teampulse_token", newToken);
        if (newRefreshToken) {
          localStorage.setItem("teampulse_refresh_token", newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("teampulse_token");
        localStorage.removeItem("teampulse_refresh_token");
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  updatePassword: (data) => api.put("/auth/password", data),
};

export const projectsAPI = {
  getProjects: () => api.get("/projects"),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post("/projects", data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // Member management & Invitations
  addMember: (projectId, data) => api.post(`/projects/${projectId}/members`, data),
  updateMemberRole: (projectId, userId, data) => api.put(`/projects/${projectId}/members/${userId}`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
  
  // Invitations
  createInvitation: (projectId, data) => api.post(`/projects/${projectId}/invitations`, data),
  getInvitations: (projectId) => api.get(`/projects/${projectId}/invitations`),
  revokeInvitation: (projectId, invitationId) => api.delete(`/projects/${projectId}/invitations/${invitationId}`),
  acceptInvitation: (token) => api.post("/invitations/accept", { token }),
};

export const milestonesAPI = {
  getMilestones: (projectId) => api.get(`/projects/${projectId}/milestones`),
  createMilestone: (projectId, data) => api.post(`/projects/${projectId}/milestones`, data),
  updateMilestone: (id, data) => api.put(`/milestones/${id}`, data),
  deleteMilestone: (id) => api.delete(`/milestones/${id}`),
};

export const tasksAPI = {
  getTasks: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  reportBlocker: (id, data) => api.post(`/tasks/${id}/blocker`, data),
  resolveBlocker: (id) => api.post(`/tasks/${id}/resolve-blocker`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const dependenciesAPI = {
  getDependencies: (projectId) => api.get(`/projects/${projectId}/dependencies`),
  addDependency: (taskId, predecessorId) => api.post(`/tasks/${taskId}/dependencies`, { predecessorId }),
  removeDependency: (taskId, predecessorId) => api.delete(`/tasks/${taskId}/dependencies/${predecessorId}`),
};

export const workloadAPI = {
  getWorkload: (projectId) => api.get(`/projects/${projectId}/workload`),
  reassign: (projectId, data) => api.post(`/projects/${projectId}/workload/reassign`, data),
};

export const analyticsAPI = {
  getContributions: (projectId) => api.get(`/projects/${projectId}/contributions`),
  getActivity: (projectId, limit = 50) => api.get(`/projects/${projectId}/activity?limit=${limit}`),
  getHealth: (projectId) => api.get(`/projects/${projectId}/health`),
};

export const commentsAPI = {
  getComments: (taskId) => api.get(`/tasks/${taskId}/comments`),
  addComment: (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text }),
};

export const reviewsAPI = {
  requestReview: (taskId, notes) => api.post(`/tasks/${taskId}/review/request`, { notes }),
  submitDecision: (taskId, decision, feedback) => api.post(`/tasks/${taskId}/review/decision`, { decision, feedback }),
};

export const attachmentsAPI = {
  getAttachments: (taskId) => api.get(`/tasks/${taskId}/attachments`),
  uploadAttachment: (taskId, formData) =>
    api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDownloadUrl: (attachmentId) => `${API_BASE_URL}/attachments/${attachmentId}/download`,
};

export const notificationsAPI = {
  getNotifications: (unreadOnly = false) => api.get(`/notifications?unreadOnly=${unreadOnly}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
};

export const reportsAPI = {
  getSummary: (projectId, params) => api.get(`/projects/${projectId}/reports/summary`, { params }),
  getExportCSVUrl: (projectId, type = "tasks") => `${API_BASE_URL}/projects/${projectId}/reports/export-csv?type=${type}`,
};

export default api;
