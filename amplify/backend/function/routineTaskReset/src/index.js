// amplify/backend/function/routineTaskReset/src/index.js
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

exports.handler = async (event) => {
  try {
    // 1. 全てのかんばんを取得
    const kanbans = await getAllKanbans();
    
    // 2. 周期に従ってリセットが必要なかんばんを特定
    const today = new Date();
    const resetNeededKanbans = kanbans.filter(kanban => {
      if (kanban.type !== 'routine') return false;
      
      // リセット周期に応じたチェック
      switch (kanban.resetPeriod) {
        case 'daily':
          return true; // 毎日リセット
        case 'weekly':
          return today.getDay() === 1; // 月曜日にリセット
        case 'monthly':
          return today.getDate() === 1; // 月初めにリセット
        default:
          return false;
      }
    });
    
    // 3. リセットが必要なかんばんの中の完了済みタスクを未完了に戻す
    for (const kanban of resetNeededKanbans) {
      await resetCompletedTasks(kanban.id);
    }
    
    return { statusCode: 200, body: 'Tasks reset successfully' };
  } catch (error) {
    console.error('Error resetting tasks:', error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

async function getAllKanbans() {
  const params = {
    TableName: process.env.API_TASTINAPI_KANBAN_TABLE_NAME
  };
  
  const result = await docClient.scan(params).promise();
  return result.Items;
}

async function resetCompletedTasks(kanbanId) {
  // 1. かんばんの完了済みタスクを取得
  const tasksParams = {
    TableName: process.env.API_TASTINAPI_TASK_TABLE_NAME,
    IndexName: 'byKanban',
    KeyConditionExpression: 'kanbanId = :kanbanId',
    FilterExpression: 'completed = :completed',
    ExpressionAttributeValues: {
      ':kanbanId': kanbanId,
      ':completed': true
    }
  };
  
  const tasksResult = await docClient.query(tasksParams).promise();
  const completedTasks = tasksResult.Items;
  
  // 2. 各タスクを未完了状態に更新
  for (const task of completedTasks) {
    const updateParams = {
      TableName: process.env.API_TASTINAPI_TASK_TABLE_NAME,
      Key: { id: task.id },
      UpdateExpression: 'set completed = :completed',
      ExpressionAttributeValues: {
        ':completed': false
      }
    };
    
    await docClient.update(updateParams).promise();
    
    // 3. 完了履歴を保存（オプション）
    const completedTaskParams = {
      TableName: process.env.API_TASTINAPI_COMPLETEDTASK_TABLE_NAME,
      Item: {
        id: uuid.v4(),
        originalTaskId: task.id,
        kanbanId: task.kanbanId,
        teamBoardId: task.kanban.teamBoardId,
        content: task.content,
        completedBy: task.assignedUserId || task.createdBy,
        completedAt: task.updatedAt,
        createdAt: new Date().toISOString()
      }
    };
    
    await docClient.put(completedTaskParams).promise();
  }
}
