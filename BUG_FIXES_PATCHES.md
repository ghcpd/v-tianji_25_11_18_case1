# Bug修复补丁详情

## 统一Diff风格补丁

### Bug #1 & #2: Profile加载依赖错误

**位置**: 第120-131行

```diff
-    // Hidden Bug #1 & #2: subtle race + wrong dependency
-    useEffect(()=>{
-      let t = ++profileToken.current;
-      fetchProfile(user).then(p=>{
-        if(t === profileToken.current){
-          setProfile(p);
-        }
-      });
-    },[]); // should depend on user
+    // Fixed: Added user dependency
+    useEffect(()=>{
+      let t = ++profileToken.current;
+      fetchProfile(user).then(p=>{
+        if(t === profileToken.current){
+          setProfile(p);
+        }
+      });
+    },[user]);
```

**说明**: 添加 `user` 到依赖数组，确保用户切换时profile正确更新。

---

### Bug #3: 搜索查询依赖错误

**位置**: 第133-139行

```diff
-    // Hidden Bug #3: stale query effect
-    useEffect(()=>{
-      const list = Object.values(profiles)
-        .filter(p=>p.name.toLowerCase().includes(query.toLowerCase()))
-        .map(p=>({id:p.id,name:p.name}));
-      setResults(list);
-    },[]); // query not included
+    // Fixed: Added query dependency
+    useEffect(()=>{
+      const list = Object.values(profiles)
+        .filter(p=>p.name.toLowerCase().includes(query.toLowerCase()))
+        .map(p=>({id:p.id,name:p.name}));
+      setResults(list);
+    },[query]);
```

**说明**: 添加 `query` 到依赖数组，确保搜索输入时结果实时更新。

---

### Bug #4: 通知加载依赖错误

**位置**: 第141-149行

```diff
-    // Hidden Bug #4: wrong dependency causes stale notifications overwrite
-    useEffect(()=>{
-      let t = ++notifToken.current;
-      fetchNotif(user).then(n=>{
-        if(t === notifToken.current){
-          setNotif(n);
-        }
-      });
-    },[query]); // should depend on user, not query
+    // Fixed: Changed dependency from query to user
+    useEffect(()=>{
+      let t = ++notifToken.current;
+      fetchNotif(user).then(n=>{
+        if(t === notifToken.current){
+          setNotif(n);
+        }
+      });
+    },[user]);
```

**说明**: 将依赖从 `[query]` 改为 `[user]`，确保通知在用户切换时更新，而不是在搜索时更新。

---

### Bug #5: 未读计数不更新

**位置**: 第151-154行

```diff
-    // Hidden Bug #5: unreadCount doesn't update
-    const unreadCount = useMemo(()=>{
-      return notif.filter(n=>!n.read).length;
-    },[]);
+    // Fixed: Added notif dependency
+    const unreadCount = useMemo(()=>{
+      return notif.filter(n=>!n.read).length;
+    },[notif]);
```

**说明**: 添加 `notif` 到依赖数组，确保未读计数随通知状态变化而更新。

---

### Bug #6: 直接修改状态数组

**位置**: 第156-161行

```diff
-    // Hidden Bug #6: marking as read mutates array incorrectly (subtle)
-    const markRead = useCallback((id)=>{
-      const item = notif.find(n=>n.id===id);
-      if(item) item.read = true; // mutation
-      setNotif(notif);          // same reference
-    },[notif]);
+    // Fixed: Create new array instead of mutating
+    const markRead = useCallback((id)=>{
+      setNotif(prevNotif => prevNotif.map(n => 
+        n.id === id ? {...n, read: true} : n
+      ));
+    },[]);
```

**说明**: 使用函数式更新创建新数组，避免直接修改状态。同时移除 `notif` 依赖，因为使用函数式更新不需要它。

---

### Bug #7: 直接修改缓存对象

**位置**: 第163-168行

```diff
-    // Hidden Bug #7: cache never updates due to object identity
-    useEffect(()=>{
-      if(profile){
-        cache[user] = profile;
-        setCache(cache); // no change
-      }
-    },[profile]);
+    // Fixed: Create new object instead of mutating
+    useEffect(()=>{
+      if(profile){
+        setCache(prevCache => ({...prevCache, [user]: profile}));
+      }
+    },[profile, user]);
```

**说明**: 使用函数式更新创建新对象，避免直接修改状态。同时添加 `user` 到依赖数组。

---

### Bug #8: 设置保存丢失字段

**位置**: 第170-173行

```diff
-    // Hidden Bug #8: settings panel overwritten unexpectedly (prop mismatch)
-    const handleSaveSettings = (s)=>{
-      setSettings({...settings, theme:s.theme}); // loses email setting
-    };
+    // Fixed: Save all settings, not just theme
+    const handleSaveSettings = (s)=>{
+      setSettings(s);
+    };
```

**说明**: 直接保存完整的settings对象，而不是只合并theme字段，避免丢失email设置。

---

### Bug #9: Load按钮直接设置profile

**位置**: 第203-205行

```diff
-                <button className="secondary" onClick={()=>{
-                  // Hidden Bug #9: incorrect profile caching behavior
-                  setProfile(profiles[r.id]);
-                }}>Load</button>
+                <button className="secondary" onClick={()=>{
+                  setUser(r.id);
+                }}>Load</button>
```

**说明**: 改为调用 `setUser(r.id)` 触发正常的profile加载流程，确保缓存和竞态条件处理正确。

---

### 额外修复: SettingsPanel状态同步

**位置**: 第75-77行

```diff
  function SettingsPanel({ userId, settings, onSave }) {
    const [local, setLocal] = useState(settings);

+    useEffect(()=>{
+      setLocal(settings);
+    },[settings]);
+
    const save = async ()=>{
```

**说明**: 添加 `useEffect` 同步props到本地状态，确保父组件更新settings时本地状态同步。

---

## 修复统计

- **总Bug数**: 9个主要bug + 1个额外修复
- **Hook依赖错误**: 4个 (Bug #1, #3, #4, #5)
- **状态直接修改**: 2个 (Bug #6, #7)
- **逻辑错误**: 3个 (Bug #8, #9, SettingsPanel同步)

## 修复原则

1. **React Hook依赖**: 所有使用的变量都必须包含在依赖数组中
2. **不可变更新**: 所有状态更新必须创建新对象/数组，不能直接修改
3. **统一状态管理**: 通过统一的状态更新机制避免竞态条件
4. **Props同步**: 受控组件的本地状态必须与props同步

