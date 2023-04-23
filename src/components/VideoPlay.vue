<template>
  <div class="app-container">
    <div class="resource-list">
      <div class="btn-bar">
        <input ref="uploadInput" v-show="false" type="file" multiple @change="changeFile" />
        <a-button type="primary" size="mini" @click="addFile('media')">添加媒体</a-button>
        <a-button type="primary" size="mini" @click="addFile('font')">添加字体</a-button>
        <a-button type="primary" size="mini" @click="addDirectory">添加文件夹</a-button>

      </div>
      <div class="file-list">
        <resource-item draggable="true" v-for="(item, index) in mediaList" :file="item" :key="item.key"
          @play="handlePlay(item)" @del="handleDel(index)" @dragstart.private="fileDragStart($event, item)"
          @dragend.private="fileDragEnd($event, item)" @dblclick="appendFile(item)" />
      </div>
    </div>
    <div class="view">
      <div class="window">
        <div class="screen">
          <video v-if="renderSrc == ''" ref="myVideo" :src="previewSrc" controls autoplay
            style="width:850px;height: 400px;object-fit:contain;border:2px solid #fff"></video>
          <canvas ref="canvas" :width="videoWidth" :height="videoHeight"></canvas>
          <!-- <video id="v-video" v-if="renderSrc != ''" :src="renderSrc" controls autoplay
            style="width:400px;object-fit:contain;border:2px solid #fff"></video> -->
        </div>
        <div class="screen2">
          <div>
            <a-time-picker v-model="sTime" format="HH:mm:ss" valueFormat="HH:mm:ss" placeholder="开始时间"
              v-bind:disabled="sDisable" hideDisabledOptions @change="startTimeChange" />
            <a-time-picker v-model="eTime" format="HH:mm:ss" valueFormat="HH:mm:ss" placeholder="结束时间"
              v-bind:disabled="eDisable" hideDisabledOptions @change="endTimeChange" />
            <a-button @click="onSureCut" type="primary" size="mini">剪切</a-button>
          </div>

          <div>
            <input type="text" v-model="danmakuText" />
            <button @click="addDanmaku">添加弹幕</button>
          </div>

        </div>
      </div>
      <div class="time-line" @dragenter="lineDragEnter" @dragleave="lineDragLeave" @dragover="lineDragOver"
        @drop="lineDropFile">
        <div class="line" draggable="true" v-for="(file, index) in timeLineList" :title="file.name" :style="{
            width: file.width + 'px',
            'margin-left': file.left + 'px',
            background: file.color
          }" :key="'timeLine' + file.key" @dragstart="lineDragStart($event, index)" @dragend="lineDragEnd"
          @dragenter="lineItemDragEnter($event, index)" @dragleave="lineItemDragLeave" @dragover="lineItemDragMove"
          @drop.prevent.stop="lineItemDropFile(index)">{{ file.name }}
        </div>
      </div>
      <div class="tool-bar">
        <tool-tab @create="handleCreateText" @render="handleRender" />
      </div>
    </div>
    <!--    加载弹窗-->
    <progress-dialog :title="progressTitle" v-if="progressVisible" :number="progressNumber" :count="progressCount" />
    <!--    时间轴示例-->
    <div class="hidden">
      <div id="move" ref="moveBlock">
        {{ nowFile.name }}
      </div>
    </div>
  </div>
</template>
  
<script setup>
import ResourceFile from '@/utils/file.js'
import { checkFontFile, checkMediaFile } from '@/utils/util.js'

import ft from '@/utils/ffmpeg.js'

import { reactive, ref, onMounted, watch ,onUpdated} from 'vue'
import ResourceItem from '@/components/videoPlayer/resource.vue'
import ToolTab from '@/components/videoPlayer/tool.vue'
import ProgressDialog from '@/components/videoPlayer/progress.vue'

ft.instance()
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg();
if (!ffmpeg.isLoaded()) {
  ffmpeg.load().catch((err) => {
    console.log(err);
  });
}
const myVideo = ref(null);
//时间选取
const sTime = ref(null);
const eTime = ref(null)
const startTime = ref('')
const endTime = ref('')
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const sDisable = ref(true)
const eDisable = ref(true)
//时间差
const startEndTime = ref('')
const hDiffrence = ref(0)
const mDiffrence = ref(0)
const sDiffrence = ref(0)


let fileSum = {}

const videoName = ref('')
const videoNewName = ref('newVideo.mp4')

//弹幕
const videoWidth = ref(null);
const videoHeight = ref(null);
const danmakuText = ref(null);
const danmakuList = ref([]);
const canvas = ref(null);




const uploadInput = ref(null)
const previewSrc = ref('')
const renderSrc = ref('')
// 进度条
const progressTitle = ref('')
const progressNumber = ref(0)
const progressCount = ref(100)
const progressVisible = ref(false)
const preVisible = ref(true)
// 媒体资源 图片 视频 音频
const mediaList = reactive([])
// 字体资源
const fontList = reactive([])
// 添加文件
let addType = ''


const onSureCut = async (e) => {
  console.log('e', e);
  console.log(videoName, videoNewName);
  try {
    if (startTime.value == '' && startEndTime.value === '') {
      alert('请先播放视频以及选择时间')
    } else {
      ffmpeg.FS('writeFile', fileSum.name, await fetchFile(fileSum));
      await ffmpeg.run('-i', fileSum.name, '-ss', startTime.value, '-t', startEndTime.value, '-c', 'copy', 'output.mp4');
      const data = ffmpeg.FS('readFile', 'output.mp4');
      if (data) {
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        previewSrc.value = URL.createObjectURL(videoBlob);
      }
    }

    // await ffmpeg.run(
    //   "-ss", `${startTime}`,
    //   "-t", `${endTime - startTime}`,
    //   "-i", videoName.value,
    //   "-vcodec", "copy",
    //   "-acodec", "copy", videoNewName.value
    // );
    // let arrayBuffer = ffmpeg.FS("readFile", videoNewName.value).buffer; // 读取缓存
    // let blob = new Blob([arrayBuffer],{type:'video/mp4'});
    // previewSrc.value = URL.createObjectURL(blob); // 转为Blob URL
    // console.log(previewSrc);
    // ff.blob = blob; //上传文件用
    // this.cut.show = false;
    // hideLoading();
  } catch (err) {
    // console.log("切视频err", err);
    throw err;
  }
}
//添加弹幕
const addDanmaku = () => {
  console.log(danmakuText.value);
  if (danmakuText.value) {
    danmakuList.value.push({
      text: danmakuText.value,
      time: myVideo.currentTime,
      color: 'red',
    });
    danmakuText.value = '';
    renderDanmaku();
  }
};
//渲染弹幕
const renderDanmaku = () => {
  const video = myVideo;
  const ctx = canvas.value.getContext('2d');
  ctx.clearRect(0, 0, can.value.width, canvas.value.height);
  for (const danmaku of danmakuList.value) {
    if (video.currentTime >= danmaku.time) {
      ctx.fillStyle = danmaku.color;
      ctx.fillText(danmaku.text, videoWidth.value, Math.random() * videoHeight.value);
    }
  }
};

onMounted(() => {
  if (previewSrc.value != null) {
    myVideo.value.addEventListener('loadedmetadata', () => {
      let s = Math.floor(myVideo.value.duration)     //秒数转毫秒数字
      // let currentTime = Math.floor(myVideo.value.currentTime)    //当前播放时间
      //时间处理
      hours.value = Math.floor(s / 3600);
      minutes.value = Math.floor((s - hours.value * 3600) / 60);
      seconds.value = s - hours.value * 3600 - minutes.value * 60;
      startTime.value = '00:00:00'
      endTime.value = `${hours.value.toString().padStart(2, '0')}:${minutes.value.toString().padStart(2, '0')}:${seconds.value.toString().padStart(2, '0')}`;
      //时间控件可选
      sDisable.value = false
      eDisable.value = false

      //弹幕宽度高度
      videoWidth.value = myVideo.videoWidth;
      videoHeight.value = myVideo.videoHeight;
      renderDanmaku();

    });
  }
  window.cancelAnimationFrame(requestId);
});
let requestId;
onUpdated(() => {
  requestId = window.requestAnimationFrame(renderDanmaku);
});
const startTimeChange = (time, timeString) => {
  console.log('stime', time, timeString);
  startTime.value = timeString
  const [sHours, sMinutes, sSeconds] = timeString.split(':').map(Number);
  if (startTime.value === '') {
    alert('请先播放视频，再选择时间')
  } else if (sHours > hours.value || sMinutes > minutes.value || sSeconds > seconds.value) {

    alert('选择时间有误，请重新选择')
  }
}
const endTimeChange = (time, timeString) => {
  console.log('etime', time, timeString);
  //开始时间
  const [sHours, sMinutes, sSeconds] = startTime.value.split(':').map(Number);
  //结束时间
  const [eHours, eMinutes, eSeconds] = timeString.split(':').map(Number);
  //时间差

  if (startTime.value === '' || endTime.value === '') {
    alert('请先播放视频')
  } else if (eHours > hours.value || eMinutes > minutes.value || eSeconds > seconds.value) {
    alert('选择时间有误，请重新选择')
  } else if (sHours > eHours) {
    alert('选择时间有误，请重新选择')
  } else if (sMinutes > eMinutes) {
    alert('选择时间有误，请重新选择')
  } else if (sSeconds > eSeconds) {
    alert('选择时间有误，请重新选择')
  }
  hDiffrence.value = eHours - sHours
  mDiffrence.value = eMinutes - sMinutes
  sDiffrence.value = eSeconds - sSeconds
  startEndTime.value = `${hDiffrence.value.toString().padStart(2, '0')}:${mDiffrence.value.toString().padStart(2, '0')}:${sDiffrence.value.toString().padStart(2, '0')}`;
}





const addDirectory = () => {
  console.log("未实现")
  alert('未实现')
}
const addFile = (type) => {
  addType = type
  uploadInput.value.click()
  console.log('添加的数据类型', addType);
}
// 选择文件
const changeFile = async function (e) {
  const files = e.target.files
  fileSum = e.target.files[0]
  const mediaLoadList = []
  const fontLoadList = []
  console.log('文件列表', files)
  for (let i = 0; i < files.length; i++) {
    const file = new ResourceFile(files[i])
    console.log('文件', file)
    file.setSize('AUTO')
    if (addType === 'media') {
      if (checkMediaFile(file)) {
        file.setMedia()
        mediaLoadList.push(file)
        // mediaList.push(file)
        continue
      }
    }
    if (addType === 'font') {
      if (checkFontFile(file)) {
        file.setFont()
        fontLoadList.push(file)
        //   fontList.push(file)
      }
    }
  }
  if (addType === 'media') {
    loadMediaFile(mediaLoadList)

  }
  if (addType === 'font') {
    loadFontFile(fontLoadList)
  }


}
// 加载文件
const loadMediaFile = async (list) => {
  console.log('加载文件', list)

  openLoadProgress(list.length, '加载资源文件')
  let i = 0
  for (const file of list) {
    await ft.loadFile(file)
    mediaList.push(file)
    i++
    setLoadProgressNumber(i)
  }
  setTimeout(() => {
    closeLoadProgress()
  }, 100)
}
const loadFontFile = async (list) => {
  console.log('加载文件', list)
  openLoadProgress(list.length, '加载字体文件')
  let i = 0
  for (const file of list) {
    await ft.loadFile(file)
    fontList.push(file)
    i++
    setLoadProgressNumber(i)
  }
  setTimeout(() => {
    closeLoadProgress()
  }, 100)
}
const handlePlay = async (file) => {

  console.log("播放文件", file.name)
  previewSrc.value = file.url
  videoName.value = file.name

}
const handleDel = (index) => {
  console.log("删除文件", index)
  mediaList.splice(index, 1)
  previewSrc.value = ''
}
// 打开进度条
const openLoadProgress = (count, title = '加载中') => {
  progressVisible.value = true
  progressCount.value = count
  progressNumber.value = 0
  progressTitle.value = title
}
// 设置进度条值
const setLoadProgressNumber = (val) => {
  progressNumber.value = val
}
// 关闭进度条
const closeLoadProgress = () => {
  progressVisible.value = false
  progressCount.value = 0
  progressNumber.value = 0
  progressTitle.value = ''
}

import Line from '@/utils/line.js'

// 时间轴
const timeLineList = ref([])
const moveStartPosition = ref({ x: 0, y: 0 })
let moveIndex = ''
let moveIn = ''
// 拖动类型
let dragType = 'create'
// 拖动的当前文件
const nowFile = ref({})
// 拖动的dom
const moveBlock = ref(null)
// 是否拖入时间揍
const lineIn = ref(false)
/**
 * 文件列表拖拽开始
 * @param $event
 * @param file
 */
const fileDragStart = ($event, file) => {
  console.log('文件列表拖拽开始', $event, file)
  dragType = 'create'
  nowFile.value = file
  let width = nowFile.value.duration * 2
  moveBlock.value.style.width = (width > 270 ? 270 : width) + 'px'
  $event.dataTransfer.setDragImage(moveBlock.value, 0, 0)
}
/**
 * 文件列表拖拽结束
 * @param $event
 * @param file
 */
const fileDragEnd = ($event, file) => {
  console.log('文件列表拖拽结束', $event, file)
  lineIn.value = false
}
/**
 * 添加到时间轴最后
 * @param item
 */
const appendFile = (item) => {
  console.log('双击添加', item)
  const file = new Line(item)
  file.setMedia()
  console.log('file', file)
  timeLineList.value.push(file)
}

/**
 * 时间轴放入
 * @param index
 */
const lineItemDropFile = (index) => {
  console.log('时间轴放入', index)
  // 放在某个轴上
  if (dragType === 'create') {
    const file = new Line(mediaList[index])
    file.setMedia()
    console.log('file', file)
    timeLineList.value.splice(index, 0, file)
  }
  // 移动
  if (dragType === 'move') {
    console.log('移动', moveIndex, index)
    let list = timeLineList.value
    if (moveIndex > index) {
      const item = timeLineList.value[moveIndex]
      list.splice(moveIndex, 1)
      list.splice(index, 0, item)
    } else {
      const item = timeLineList.value[moveIndex]
      console.log('移动', item, list)
      list.splice(moveIndex, 1)
      list.splice(index, 0, item)
      console.log("移动到后面", list)
    }
    timeLineList.value = list
  }
}
const lineDragStart = ($event, index) => {
  console.log('时间轴拖动开始', index, $event)
  dragType = 'move'
  moveIndex = index
  moveStartPosition.value.x = $event.pageX
  moveStartPosition.value.y = $event.pageY
}
/**
 * 时间轴拖动结束
 * @param $event
 * @constructor
 */
const lineDragEnd = ($event) => {
  console.log('时间轴拖动结束', $event)
  console.log('移动了', $event.pageX - moveStartPosition.value.x, $event.pageY - moveStartPosition.value.y)
  timeLineList.value[moveIndex].left += $event.pageX - moveStartPosition.value.x
  moveStartPosition.value.x = 0
  moveStartPosition.value.y = 0
  moveIndex = ''
}
/**
 * 时间轴内容进入
 * @param $event
 * @constructor
 */
const lineItemDragEnter = ($event, index) => {
  console.log('时间轴进入', $event)
  $event.preventDefault(); //阻止默认事件
  moveIn = index
}
/**
 * 时间轴内容离开
 * @param $event
 * @constructor
 */
const lineItemDragLeave = ($event) => {
  console.log('时间轴离开', $event)
  $event.preventDefault(); //阻止默认事件
  moveIn = ''
}
/**
 * 时间轴内容移动
 * @param $event
 */
const lineItemDragMove = ($event) => {
  console.log("拖拽移动", $event)
  console.log('移动了', $event.pageX - moveStartPosition.value.x, $event.pageY - moveStartPosition.value.y)
}
/**
 * 时间轴进入
 * @param $event
 * @constructor
 */
const lineDragEnter = ($event) => {
  console.log('时间列表进入', $event)
  $event.preventDefault(); //阻止默认事件
  lineIn.value = true
}

/**
 * 时间轴离开
 * @param $event
 * @param file
 * @constructor
 */
const lineDragLeave = ($event, file) => {
  console.log('时间列表离开', $event)
  $event.preventDefault(); //阻止默认事件
  lineIn.value = false
}

/**
 * 时间轴阻止默认
 * @param $event
 * @constructor
 */
const lineDragOver = ($event) => {
  $event.preventDefault(); //阻止默认事件
}

/**
 * 时间轴放入
 * @param $event
 */
const lineDropFile = ($event) => {
  console.log('时间列表放入', dragType, $event)
  // 放在空的地方
  if (dragType === 'create') {
    let file = new Line(nowFile.value)
    file.setMedia()
    console.log('file', file)
    timeLineList.value.push(file)
  }
}

const handleCreateText = (text) => {
  let data = {
    key: '',
    name: text,
    duration: 30,
    left: 0
  }
  const item = new Line(data)
  console.log('item', item);
  item.setText()
  console.log('font', fontList);
  item.setFont(item.name)
  console.log('添加', item, item.name)
  timeLineList.value.push(item)
}
//渲染视频
const handleRender = () => {
  console.log("渲染视频")
  let args = ft.generateArgs(timeLineList.value)
  ft.run(args)
  console.log('ft.progress', ft.progress)
  openLoadProgress(100, '渲染中')
  ft.updateProgress = updateRender
}
const updateRender = (progress) => {
  setLoadProgressNumber(parseInt(progress.ratio))
  if (progress.ratio >= 100) {
    setTimeout(() => {
      closeLoadProgress()
      previewRender()
    }, 1000)

  }
}
const previewRender = () => {
  ft.readFile(ft.renderFileName).then(res => {
    console.log("文件", res)
    renderSrc.value = res
  })
}
window.ft = ft
</script>
  
<style lang="less" scoped>
@import "../utils/index.less";

.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  position: relative;
}

.resource-list {
  display: flex;
  flex-direction: column;
  width: @resource-width;
  height: 100%;
  box-sizing: border-box;
  border-right: @border-color 1px solid;

  .btn-bar {
    display: flex;
    border-bottom: @border-color 1px solid;

    button {
      flex: 1;
      margin: 5px;
    }
  }

  .file-list {
    width: 300px;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.view {
  flex: 1;
  display: flex;
  flex-direction: column;

  .window {
    flex: 1;
    box-sizing: border-box;
    border-bottom: @border-color 1px solid;
    display: flex;

    .screen {
      width: 400px;
      flex: 1;
      box-sizing: border-box;
      // display: flex;
      // justify-content: center;
      // align-items: center;

      &:first-child {
        border-right: @border-color 1px solid;
      }

      video {
        width: 100%;
        max-height: 100%;
        //max-width: 1024px;
        //max-height: 768px;
      }
    }

    .screen2 {
      width: 400px;

      box-sizing: border-box;
    }
  }

  .time-line {
    width: calc(100vw - @resource-width);
    height: 300px;
    box-sizing: border-box;
    border-bottom: @border-color 1px solid;
    overflow-x: scroll;

    .line {
      cursor: move;
      height: 20px;
      white-space: nowrap;
      /*不显示的地方用省略号...代替*/
      text-overflow: ellipsis;
      /* 支持 IE */
      line-height: 20px;
      padding-left: 10px;
      box-sizing: border-box;
      border-bottom: @border-color 1px solid;
      background-color: rgba(248, 235, 174, 0.78);
      user-select: none;
      overflow: hidden;

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .tool-bar {
    height: 100px;
    box-sizing: border-box;
  }
}

.hidden {
  position: fixed;
  left: 0;
  top: -100px;

  #move {
    min-width: 20px;
    height: 20px;
    background: red;
    border: 1px solid #07b3c9;
    overflow: hidden;
  }
}
</style>
