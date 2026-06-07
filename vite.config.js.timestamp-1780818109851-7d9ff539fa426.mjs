// vite.config.js
import { defineConfig } from "file:///sessions/affectionate-intelligent-rubin/mnt/adstudio/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/affectionate-intelligent-rubin/mnt/adstudio/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/chat": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        rewrite: () => "/v1/chat/completions",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const key = process.env.VITE_DEEPSEEK_API_KEY;
            if (key) proxyReq.setHeader("Authorization", `Bearer ${key}`);
          });
        }
      },
      "/api/generate": {
        target: "https://api.kie.ai",
        changeOrigin: true,
        rewrite: () => "/api/v1/flux/kontext/generate",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const key = process.env.VITE_KIE_API_KEY;
            if (key) proxyReq.setHeader("Authorization", `Bearer ${key}`);
          });
        }
      },
      "/api/poll": {
        target: "https://api.kie.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace("/api/poll", "/api/v1/flux/kontext/record-info"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const key = process.env.VITE_KIE_API_KEY;
            if (key) proxyReq.setHeader("Authorization", `Bearer ${key}`);
          });
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYWZmZWN0aW9uYXRlLWludGVsbGlnZW50LXJ1YmluL21udC9hZHN0dWRpb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2FmZmVjdGlvbmF0ZS1pbnRlbGxpZ2VudC1ydWJpbi9tbnQvYWRzdHVkaW8vdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2FmZmVjdGlvbmF0ZS1pbnRlbGxpZ2VudC1ydWJpbi9tbnQvYWRzdHVkaW8vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaS9jaGF0Jzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5kZWVwc2Vlay5jb20nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6ICgpID0+ICcvdjEvY2hhdC9jb21wbGV0aW9ucycsXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBwcm9jZXNzLmVudi5WSVRFX0RFRVBTRUVLX0FQSV9LRVlcbiAgICAgICAgICAgIGlmIChrZXkpIHByb3h5UmVxLnNldEhlYWRlcignQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHtrZXl9YClcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgICcvYXBpL2dlbmVyYXRlJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5raWUuYWknLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6ICgpID0+ICcvYXBpL3YxL2ZsdXgva29udGV4dC9nZW5lcmF0ZScsXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBwcm9jZXNzLmVudi5WSVRFX0tJRV9BUElfS0VZXG4gICAgICAgICAgICBpZiAoa2V5KSBwcm94eVJlcS5zZXRIZWFkZXIoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7a2V5fWApXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAnL2FwaS9wb2xsJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5raWUuYWknLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoJy9hcGkvcG9sbCcsICcvYXBpL3YxL2ZsdXgva29udGV4dC9yZWNvcmQtaW5mbycpLFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSkgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gcHJvY2Vzcy5lbnYuVklURV9LSUVfQVBJX0tFWVxuICAgICAgICAgICAgaWYgKGtleSkgcHJveHlSZXEuc2V0SGVhZGVyKCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke2tleX1gKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVixTQUFTLG9CQUFvQjtBQUM5VyxPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLGFBQWE7QUFBQSxRQUNYLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsTUFBTTtBQUFBLFFBQ2YsV0FBVyxDQUFDLFVBQVU7QUFDcEIsZ0JBQU0sR0FBRyxZQUFZLENBQUMsYUFBYTtBQUNqQyxrQkFBTSxNQUFNLFFBQVEsSUFBSTtBQUN4QixnQkFBSSxJQUFLLFVBQVMsVUFBVSxpQkFBaUIsVUFBVSxHQUFHLEVBQUU7QUFBQSxVQUM5RCxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGlCQUFpQjtBQUFBLFFBQ2YsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxNQUFNO0FBQUEsUUFDZixXQUFXLENBQUMsVUFBVTtBQUNwQixnQkFBTSxHQUFHLFlBQVksQ0FBQyxhQUFhO0FBQ2pDLGtCQUFNLE1BQU0sUUFBUSxJQUFJO0FBQ3hCLGdCQUFJLElBQUssVUFBUyxVQUFVLGlCQUFpQixVQUFVLEdBQUcsRUFBRTtBQUFBLFVBQzlELENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLE1BQ0EsYUFBYTtBQUFBLFFBQ1gsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGFBQWEsa0NBQWtDO0FBQUEsUUFDL0UsV0FBVyxDQUFDLFVBQVU7QUFDcEIsZ0JBQU0sR0FBRyxZQUFZLENBQUMsYUFBYTtBQUNqQyxrQkFBTSxNQUFNLFFBQVEsSUFBSTtBQUN4QixnQkFBSSxJQUFLLFVBQVMsVUFBVSxpQkFBaUIsVUFBVSxHQUFHLEVBQUU7QUFBQSxVQUM5RCxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
