import { Router, Request, Response } from 'express';
import { WeChatParser } from '../services/parser';
import { UserInfo, ApiResponse } from '../types';

const router = Router();
const parser = new WeChatParser();

/**
 * GET /api/users?path=/path/to/documents
 * 获取所有微信用户列表
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const documentsPath = req.query.path as string;

    if (!documentsPath) {
      return res.status(400).json({
        success: false,
        error: '请提供微信数据目录路径 (path 参数)',
      } as ApiResponse<null>);
    }

    // 解析 LoginInfo2.dat 获取用户信息映射
    const userInfoMap = parser.parseLoginInfo(documentsPath);
    
    // 扫描用户目录
    const userMd5s = parser.scanUsers(documentsPath);
    
    // 合并信息
    const users: UserInfo[] = [];
    for (const md5 of userMd5s) {
      const userInfo = userInfoMap.get(md5);
      const avatar = parser.getUserAvatar(documentsPath, md5);
      
      users.push({
        md5,
        wechatId: userInfo?.wechatId || `用户-${md5.substring(0, 8)}`,
        nickname: userInfo?.nickname || `用户-${md5.substring(0, 8)}`,
        avatar,
      });
    }

    console.log(`✅ 返回 ${users.length} 个用户`);
    
    res.json({
      success: true,
      data: users,
    } as ApiResponse<UserInfo[]>);
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误',
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/users/:md5
 * 获取单个用户详情
 */
router.get('/:md5', (req: Request, res: Response) => {
  try {
    const { md5 } = req.params;
    const documentsPath = req.query.path as string;

    if (!documentsPath) {
      return res.status(400).json({
        success: false,
        error: '请提供微信数据目录路径 (path 参数)',
      } as ApiResponse<null>);
    }

    const userInfoMap = parser.parseLoginInfo(documentsPath);
    const userInfo = userInfoMap.get(md5);
    const avatar = parser.getUserAvatar(documentsPath, md5);

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: {
        ...userInfo,
        avatar,
      },
    } as ApiResponse<UserInfo>);
  } catch (error: any) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误',
    } as ApiResponse<null>);
  }
});

export default router;

