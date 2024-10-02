import mongoose, {Schema} from "mongoose";
import { type } from "os";

const LikeSchema = new Schema(
    {
        video:{
        type:Schema.Types.ObjectId,
        required:true
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    LikeBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},
{
    timestamps:true
}
)


export const Like = mongoose.model("Like",LikeSchema);