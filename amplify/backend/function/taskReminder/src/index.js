// amplify/backend/function/taskReminder/src/index.js
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ region: 'ap-northeast-1' }); // 東京リージョンを例として使用

exports.handler = async (event) => {
  try {
    // 1. ユーザー設定からリマインダーが有効なユーザーを取得
    const usersWithReminders = await getUsersWithActiveReminders();
    
    // 2. 各ユーザーに割り当てられた未完了タスクを取得
    for (const user of usersWithReminders) {
      const uncompletedTasks = await getUncompletedTasksForUser(user.id);
      
      // 3. タスクがあればメール送信
      if (uncompletedTasks.length > 0) {
        await sendReminderEmail(user.email, uncompletedTasks);
      }
    }
    
    return { statusCode: 200, body: 'Reminders sent successfully' };
  } catch (error) {
    console.error('Error sending reminders:', error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

async function getUsersWithActiveReminders() {
  // 通知設定が有効なユーザーを取得するロジック
  // settingsフィールドがJSONで、通知設定を含む
  // 実際の実装はスキーマに応じて調整が必要
  
  const params = {
    TableName: process.env.API_TASTINAPI_USER_TABLE_NAME,
    FilterExpression: 'contains(settings, :reminderSetting)',
    ExpressionAttributeValues: {
      ':reminderSetting': '"notifications":true'
    }
  };
  
  const result = await docClient.scan(params).promise();
  return result.Items;
}

async function getUncompletedTasksForUser(userId) {
  // ユーザーに割り当てられた未完了タスクを取得
  const params = {
    TableName: process.env.API_TASTINAPI_TASK_TABLE_NAME,
    IndexName: 'byUser',
    KeyConditionExpression: 'assignedUserId = :userId',
    FilterExpression: 'completed = :completed',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': false
    }
  };
  
  const result = await docClient.query(params).promise();
  return result.Items;
}

async function sendReminderEmail(email, tasks) {
  // メール本文の作成
  const taskList = tasks.map(task => 
    `- ${task.content}${task.dueDate ? ` (期限: ${new Date(task.dueDate).toLocaleDateString('ja-JP')})` : ''}`
  ).join('\n');
  
  const params = {
    Source: 'notifications@yourdomain.com', // 通知用メールアドレス
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: {
        Data: 'タスティン - 未完了タスクのリマインダー'
      },
      Body: {
        Text: {
          Data: `以下のタスクが未完了です：\n\n${taskList}\n\nタスティンにログインして確認してください。`
        }
      }
    }
  };
  
  return ses.sendEmail(params).promise();
}
